import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getGapAnalysis } from "@/lib/gap-queries";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { simulation_id } = await req.json();
  if (!simulation_id) {
    return NextResponse.json(
      { error: "simulation_id required" },
      { status: 400 },
    );
  }

  // Verify ownership
  const { data: sim } = await supabase
    .from("simulations")
    .select("id, total_questions, correct_answers")
    .eq("id", simulation_id)
    .eq("user_id", user.id)
    .single();

  if (!sim) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const gapData = await getGapAnalysis(supabase, user.id);

  const overall_accuracy =
    sim.total_questions > 0
      ? Math.round((sim.correct_answers / sim.total_questions) * 100)
      : 0;

  const adviceMap: Record<string, string> = {
    low: "Poucos dados — faça mais questões para análise precisa.",
    medium: "Continue praticando para consolidar o conhecimento.",
    high: "Foque em exercícios difíceis para subir de nível.",
  };

  const top_gaps = gapData.specialties.slice(0, 3).map((g) => ({
    specialty_name: g.specialty_name,
    specialty_slug: g.specialty_slug,
    combined_accuracy: g.combined_accuracy,
    advice:
      g.combined_accuracy < 50
        ? "Prioridade alta — revise os conceitos fundamentais."
        : adviceMap[g.data_confidence] ?? adviceMap.medium,
  }));

  return NextResponse.json({
    top_gaps,
    overall_accuracy,
  });
}
