import { Metadata } from "next";
import { createClient, getUser } from "@/lib/supabase/server";
import { getGapAnalysis } from "@/lib/gap-queries";
import { GapsDashboard } from "./gaps-dashboard";

export const metadata: Metadata = {
  title: "Lacunas de Conhecimento",
};

export default async function GapsPage() {
  const supabase = await createClient();
  const user = await getUser();
  const userId = user!.id;

  const EMPTY_GAP: import("@/lib/gap-queries").GapAnalysisData = { specialties: [], banca_name: null, total_flashcard_reviews: 0, total_simulation_questions: 0, has_flashcard_data: false, has_simulation_data: false, overall_accuracy: 0 };
  const data = await getGapAnalysis(supabase, userId).catch(() => EMPTY_GAP);

  return <GapsDashboard data={data} />;
}
