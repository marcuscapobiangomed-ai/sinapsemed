import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getGroq, GROQ_MODEL } from "@/lib/ai";
import { getGapAnalysis } from "@/lib/gap-queries";
import { getNextSprintNumber } from "@/lib/sprint-queries";

interface CreateSprintBody {
  sprint_type: "foundation" | "deepening" | "revision" | "final_80_20";
  duration_days: number;
}

const TYPE_LABELS: Record<string, string> = {
  foundation: "Construção de Base",
  deepening: "Aprofundamento",
  revision: "Revisão",
  final_80_20: "Reta Final 80/20",
};

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as CreateSprintBody;
  const { sprint_type, duration_days } = body;

  if (!sprint_type || !duration_days) {
    return NextResponse.json(
      { error: "sprint_type and duration_days required" },
      { status: 400 },
    );
  }

  // Check no active sprint already
  const { data: existing } = await supabase
    .from("sprints")
    .select("id")
    .eq("user_id", user.id)
    .neq("current_phase", "completed")
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { error: "Você já tem um Sprint ativo" },
      { status: 409 },
    );
  }

  // Run gap analysis for diagnostic
  const gapAnalysis = await getGapAnalysis(supabase, user.id);
  const sprintNumber = await getNextSprintNumber(supabase, user.id);

  // Build AI prompt
  const topGaps = gapAnalysis.specialties
    .filter((s) => s.data_confidence !== "low")
    .sort((a, b) => a.combined_accuracy - b.combined_accuracy)
    .slice(0, 8);

  const gapSummary = topGaps
    .map(
      (g) =>
        `- ${g.specialty_name}: ${g.combined_accuracy}% acerto (peso banca: ${g.banca_weight})`,
    )
    .join("\n");

  const prompt = `Você é um mentor de residência médica. Com base na análise de lacunas abaixo, crie o plano para um Sprint de estudo tipo "${TYPE_LABELS[sprint_type]}" de ${duration_days} dias.

ANÁLISE DE LACUNAS:
Overall accuracy: ${gapAnalysis.overall_accuracy}%
Banca: ${gapAnalysis.banca_name || "não definida"}
${gapSummary}

REGRAS:
1. Selecione 3-5 especialidades foco (as que mais impactam a nota na banca)
2. Distribua pesos entre elas (soma = 1.0)
3. Crie 4-6 metas mensuráveis para o Sprint
4. O título deve ser "Sprint ${sprintNumber}: [tema criativo]"

${sprint_type === "final_80_20" ? "MODO 80/20: Foque apenas nas especialidades de maior peso na prova. Zero conteúdo novo, apenas revisão e consolidação." : ""}

Responda APENAS com JSON válido neste formato:
{
  "title": "Sprint N: Nome Criativo",
  "focus_specialties": [
    {"slug": "cardiologia", "name": "Cardiologia", "weight": 0.3, "reason": "Maior peso na banca e acerto atual baixo"}
  ],
  "goals": [
    {"title": "Atingir 70% em Cardiologia", "goal_type": "accuracy", "target_value": 70, "specialty_slug": "cardiologia"},
    {"title": "Revisar 500 cards", "goal_type": "reviews", "target_value": 500, "specialty_slug": null},
    {"title": "Completar 4 simulados", "goal_type": "simulations", "target_value": 4, "specialty_slug": null},
    {"title": "Estudar 15h por semana", "goal_type": "study_time", "target_value": 900, "specialty_slug": null}
  ]
}`;

  let aiResult: {
    title: string;
    focus_specialties: Array<{
      slug: string;
      name: string;
      weight: number;
      reason: string;
    }>;
    goals: Array<{
      title: string;
      goal_type: string;
      target_value: number;
      specialty_slug: string | null;
    }>;
  };

  try {
    const groq = getGroq();
    const completion = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages: [
        { role: "system", content: "Responda APENAS com JSON válido. Nenhum texto extra." },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 1500,
      response_format: { type: "json_object" },
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    aiResult = JSON.parse(raw);
  } catch {
    // Fallback: create sprint without AI
    const fallbackTitle = `Sprint ${sprintNumber}: ${TYPE_LABELS[sprint_type]}`;
    const fallbackFocus = topGaps.slice(0, 4).map((g, i) => ({
      slug: g.specialty_slug,
      name: g.specialty_name,
      weight: i === 0 ? 0.35 : i === 1 ? 0.25 : i === 2 ? 0.2 : 0.2,
      reason: `Acerto atual: ${g.combined_accuracy}%`,
    }));

    aiResult = {
      title: fallbackTitle,
      focus_specialties: fallbackFocus,
      goals: [
        { title: "Revisar 300 cards", goal_type: "reviews", target_value: 300, specialty_slug: null },
        { title: "Completar 3 simulados", goal_type: "simulations", target_value: 3, specialty_slug: null },
      ],
    };
  }

  // Calculate dates
  const startDate = new Date();
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + duration_days - 1);

  const formatDate = (d: Date) => d.toISOString().split("T")[0];

  // Insert sprint
  const { data: sprint, error: sprintError } = await supabase
    .from("sprints")
    .insert({
      user_id: user.id,
      title: aiResult.title,
      sprint_number: sprintNumber,
      sprint_type,
      start_date: formatDate(startDate),
      end_date: formatDate(endDate),
      current_phase: "active",
      diagnostic_start: gapAnalysis,
      focus_specialties: aiResult.focus_specialties,
      is_80_20_mode: sprint_type === "final_80_20",
    })
    .select("id")
    .single();

  if (sprintError) {
    return NextResponse.json(
      { error: sprintError.message },
      { status: 500 },
    );
  }

  // Insert goals
  if (aiResult.goals && aiResult.goals.length > 0) {
    const goalsToInsert = aiResult.goals.map((g) => ({
      sprint_id: sprint.id,
      title: g.title,
      goal_type: g.goal_type,
      target_value: g.target_value,
      specialty_slug: g.specialty_slug,
    }));

    await supabase.from("sprint_goals").insert(goalsToInsert);
  }

  return NextResponse.json({ id: sprint.id });
}
