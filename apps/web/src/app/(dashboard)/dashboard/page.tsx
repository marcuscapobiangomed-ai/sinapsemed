import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import {
  getStreak,
  getAccuracyOverTime,
  getHeatmapData,
  getCardStateDistribution,
  getDeckPerformance,
} from "@/lib/dashboard-queries";
import { getApprovalPrediction } from "@/lib/prediction-queries";
import {
  getComplexityAggregated,
  getApprovalTrendData,
  getRadarData,
  getFrictionAlerts,
} from "@/lib/analytics-queries";
import { DashboardClient } from "./dashboard-client";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const userId = user!.id;

  // Fetch all data in parallel
  const [
    profileResult,
    decksResult,
    flashcardsResult,
    dueResult,
    streak,
    accuracyData,
    heatmapData,
    cardStateData,
    deckPerformanceData,
    prediction,
    complexityData,
    approvalTrendData,
    radarData,
    frictionAlerts,
  ] = await Promise.all([
    supabase.from("profiles").select("full_name").eq("id", userId).single(),
    supabase
      .from("decks")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("is_archived", false),
    supabase
      .from("flashcards")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),
    supabase
      .from("flashcards")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("is_suspended", false)
      .lte("next_review_at", new Date().toISOString()),
    getStreak(supabase, userId),
    getAccuracyOverTime(supabase, userId),
    getHeatmapData(supabase, userId),
    getCardStateDistribution(supabase, userId),
    getDeckPerformance(supabase, userId),
    getApprovalPrediction(supabase, userId),
    getComplexityAggregated(supabase, userId),
    getApprovalTrendData(supabase, userId),
    getRadarData(supabase, userId),
    getFrictionAlerts(supabase, userId),
  ]);

  const firstName = profileResult.data?.full_name?.split(" ")[0] ?? "Estudante";
  const dueCount = dueResult.count ?? 0;

  return (
    <DashboardClient
      firstName={firstName}
      dueCount={dueCount}
      decksCount={decksResult.count ?? 0}
      flashcardsCount={flashcardsResult.count ?? 0}
      streak={streak}
      accuracyData={accuracyData}
      heatmapData={heatmapData}
      cardStateData={cardStateData}
      deckPerformanceData={deckPerformanceData}
      prediction={prediction}
      complexityData={complexityData}
      approvalTrendData={approvalTrendData}
      radarData={radarData}
      frictionAlerts={frictionAlerts}
    />
  );
}
