import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getGroq, GROQ_MODEL } from "@/lib/ai";

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { week_start } = (await req.json()) as { week_start: string };
  if (!week_start) {
    return NextResponse.json({ error: "week_start required" }, { status: 400 });
  }

  // Check premium
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("plans(has_priority_ai)")
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const planData = sub?.plans as any;
  if (!planData?.has_priority_ai) {
    return NextResponse.json(
      { error: "Disponível apenas para plano Premium" },
      { status: 403 },
    );
  }

  // Gather context
  const weekEnd = addDays(week_start, 6);

  const [dueBySpecialty, gaps, userBancas, profile, existingEntries, specialties] =
    await Promise.all([
      // Due cards grouped by specialty
      supabase
        .from("flashcards")
        .select("specialty_id, specialties(name, slug)")
        .eq("user_id", user.id)
        .eq("is_suspended", false)
        .not("next_review_at", "is", null)
        .gte("next_review_at", `${week_start}T00:00:00`)
        .lt("next_review_at", `${addDays(week_start, 7)}T00:00:00`),

      // Active knowledge gaps
      supabase
        .from("knowledge_gaps")
        .select("topic, severity, specialties(name)")
        .eq("user_id", user.id)
        .eq("is_resolved", false)
        .order("severity", { ascending: true })
        .limit(10),

      // User bancas
      supabase
        .from("user_bancas")
        .select("bancas(name, specialty_weights)")
        .eq("user_id", user.id),

      // Profile
      supabase
        .from("profiles")
        .select("study_hours_per_day, target_year")
        .eq("id", user.id)
        .single(),

      // Existing entries for this week
      supabase
        .from("study_plan_entries")
        .select("day_of_week, specialty_id, specialties(slug)")
        .eq("user_id", user.id)
        .eq("week_start", week_start),

      // All specialties
      supabase.from("specialties").select("id, name, slug").order("name"),
    ]);

  // Count due cards per specialty
  const dueCountMap = new Map<string, { slug: string; name: string; count: number }>();
  for (const fc of dueBySpecialty.data ?? []) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const spec = fc.specialties as any;
    if (!spec?.slug) continue;
    const existing = dueCountMap.get(spec.slug) ?? { slug: spec.slug, name: spec.name, count: 0 };
    existing.count++;
    dueCountMap.set(spec.slug, existing);
  }

  const dueCardsSummary = [...dueCountMap.values()]
    .sort((a, b) => b.count - a.count)
    .map((s) => `${s.name}: ${s.count} cards`)
    .join("\n");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const gapsSummary = (gaps.data ?? []).map((g: any) => {
    const specName = g.specialties?.name ?? "Geral";
    return `[${g.severity}] ${g.topic} (${specName})`;
  }).join("\n");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bancasSummary = (userBancas.data ?? []).map((ub: any) => {
    const b = ub.bancas;
    return b?.name ?? "—";
  }).join(", ");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const existingSummary = (existingEntries.data ?? []).map((e: any) => {
    const dayNames = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
    return `${dayNames[e.day_of_week]}: ${e.specialties?.slug ?? "?"}`;
  }).join("\n");

  const studyHours = Number(profile.data?.study_hours_per_day ?? 4);
  const specialtiesList = (specialties.data ?? []).map((s) => s.slug).join(", ");

  const prompt = `Você é um planejador de estudos para residência médica brasileira.

Perfil do estudante:
- Horas disponíveis por dia: ${studyHours}h
- Bancas alvo: ${bancasSummary || "Não definidas"}
- Semana: ${week_start} a ${weekEnd}

Cards de revisão pendentes nesta semana (por especialidade):
${dueCardsSummary || "Nenhum card pendente"}

Lacunas de conhecimento ativas:
${gapsSummary || "Nenhuma lacuna registrada"}

Blocos já existentes nesta semana (NÃO duplicar):
${existingSummary || "Nenhum bloco existente"}

Especialidades válidas (use apenas estes slugs):
${specialtiesList}

Gere um plano semanal como JSON array. Cada entrada:
{
  "day_of_week": 0-6 (0=Segunda, 6=Domingo),
  "specialty_slug": "slug_da_especialidade",
  "planned_minutes": 30-120
}

Regras:
- Total de minutos por dia NÃO deve exceder ${studyHours * 60}
- Priorize especialidades com mais cards pendentes
- Aborde lacunas de conhecimento críticas primeiro
- Blocos de no mínimo 30 minutos
- NÃO crie entradas para combinação dia+especialidade já existente
- Sábado e Domingo podem ter menos blocos
- INTERCALAÇÃO OBRIGATÓRIA: nunca coloque mais de 2 blocos seguidos da mesma grande área (ex: Cardiologia + Nefrologia são ambas de Clínica Médica). Alterne entre áreas diferentes (Clínica → Cirurgia → Pediatria → GOB → Preventiva) para forçar prática intercalada
- Retorne um JSON: { "blocks": [...], "strategy": "breve explicação de 1 frase da estratégia usada" }`;


  const completion = await getGroq().chat.completions.create({
    model: GROQ_MODEL,
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
    temperature: 0.3,
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    return NextResponse.json({ error: "AI returned empty response" }, { status: 500 });
  }

  // Parse response
  let blocks: Array<{ day_of_week: number; specialty_slug: string; planned_minutes: number }>;
  let strategy = "";
  try {
    const parsed = JSON.parse(content);
    // The LLM might wrap in { "blocks": [...], "strategy": "..." } or return bare array
    blocks = Array.isArray(parsed) ? parsed : (parsed.blocks ?? parsed.plan ?? parsed.entries ?? []);
    strategy = parsed.strategy ?? "";
  } catch {
    return NextResponse.json({ error: "AI returned invalid JSON" }, { status: 500 });
  }

  // Map specialty slugs to IDs
  const slugToId = new Map((specialties.data ?? []).map((s) => [s.slug, s.id]));

  // Build existing set to prevent duplicates
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const existingSet = new Set((existingEntries.data ?? []).map((e: any) =>
    `${e.day_of_week}:${e.specialties?.slug}`,
  ));

  const toInsert = blocks
    .filter((b) => {
      const specialtyId = slugToId.get(b.specialty_slug);
      if (!specialtyId) return false;
      if (b.day_of_week < 0 || b.day_of_week > 6) return false;
      if (b.planned_minutes < 5 || b.planned_minutes > 480) return false;
      if (existingSet.has(`${b.day_of_week}:${b.specialty_slug}`)) return false;
      return true;
    })
    .map((b) => ({
      user_id: user.id,
      week_start,
      day_of_week: b.day_of_week,
      specialty_id: slugToId.get(b.specialty_slug)!,
      planned_minutes: b.planned_minutes,
      is_ai_generated: true,
    }));

  if (toInsert.length === 0) {
    return NextResponse.json({ message: "Nenhum bloco novo para adicionar", count: 0 });
  }

  const { error } = await supabase.from("study_plan_entries").insert(toInsert);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: "Plano gerado", count: toInsert.length, strategy });
}

function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d + days);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
