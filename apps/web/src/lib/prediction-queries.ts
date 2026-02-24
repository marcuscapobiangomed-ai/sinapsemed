import { SupabaseClient } from "@supabase/supabase-js";
import { getGapAnalysis, type GapAnalysisData } from "./gap-queries";
import { getSimulationStats, type SimulationStats } from "./simulation-queries";

export interface ApprovalPrediction {
  probability: number; // 0-100
  confidence: "low" | "medium" | "high";
  trend: "improving" | "stable" | "declining";
  banca_name: string | null;
  weighted_accuracy: number;
  overall_accuracy: number;
  simulation_count: number;
  strengths: string[];
  critical_gaps: string[];
  data_points: number;
}

export async function getApprovalPrediction(
  supabase: SupabaseClient,
  userId: string,
): Promise<ApprovalPrediction> {
  const [gapData, simStats] = await Promise.all([
    getGapAnalysis(supabase, userId),
    getSimulationStats(supabase, userId),
  ]);

  return computePrediction(gapData, simStats);
}

function computePrediction(
  gap: GapAnalysisData,
  simStats: SimulationStats,
): ApprovalPrediction {
  const hasData = gap.has_flashcard_data || gap.has_simulation_data;
  const totalDataPoints = gap.total_flashcard_reviews + gap.total_simulation_questions;

  if (!hasData) {
    return {
      probability: 0,
      confidence: "low",
      trend: "stable",
      banca_name: gap.banca_name,
      weighted_accuracy: 0,
      overall_accuracy: 0,
      simulation_count: 0,
      strengths: [],
      critical_gaps: [],
      data_points: 0,
    };
  }

  // 1. Weighted specialty accuracy (by banca weights)
  const hasBancaWeights = gap.specialties.some((s) => s.banca_weight > 0);
  let weightedAccuracy: number;

  if (hasBancaWeights) {
    let totalWeight = 0;
    let weightedSum = 0;
    for (const s of gap.specialties) {
      if (s.banca_weight > 0) {
        totalWeight += s.banca_weight;
        weightedSum += s.combined_accuracy * s.banca_weight;
      }
    }
    weightedAccuracy = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : gap.overall_accuracy;
  } else {
    weightedAccuracy = gap.overall_accuracy;
  }

  // 2. Trend factor
  const trendValue = simStats.trend; // positive = improving
  let trend: "improving" | "stable" | "declining";
  if (trendValue > 3) trend = "improving";
  else if (trendValue < -3) trend = "declining";
  else trend = "stable";

  // Trend boost: up to ±5 percentage points
  const trendBoost = Math.max(-5, Math.min(5, trendValue * 0.5));

  // 3. Confidence level
  let confidence: "low" | "medium" | "high";
  if (totalDataPoints < 30) confidence = "low";
  else if (totalDataPoints < 100) confidence = "medium";
  else confidence = "high";

  // Confidence multiplier dampens prediction when we have little data
  const confidenceMultiplier =
    confidence === "low" ? 0.7 :
    confidence === "medium" ? 0.85 :
    1.0;

  // 4. Compute base probability
  // Formula: weighted accuracy + trend boost, scaled by confidence
  const baseScore = weightedAccuracy + trendBoost;
  const adjustedScore = baseScore * confidenceMultiplier;

  // Apply a sigmoid-like curve to make the middle range more sensitive
  // and compress the extremes (nobody is truly 0% or 100% likely)
  const probability = Math.round(
    Math.max(5, Math.min(95, adjustedScore)),
  );

  // 5. Identify strengths and gaps
  const strengths = gap.specialties
    .filter((s) => s.combined_accuracy >= 70 && s.banca_weight > 0.05)
    .sort((a, b) => b.combined_accuracy - a.combined_accuracy)
    .slice(0, 3)
    .map((s) => s.specialty_name);

  const criticalGaps = gap.specialties
    .filter((s) => s.combined_accuracy < 50 && s.banca_weight > 0.05)
    .sort((a, b) => b.priority_score - a.priority_score)
    .slice(0, 3)
    .map((s) => s.specialty_name);

  return {
    probability,
    confidence,
    trend,
    banca_name: gap.banca_name,
    weighted_accuracy: weightedAccuracy,
    overall_accuracy: gap.overall_accuracy,
    simulation_count: simStats.total_count,
    strengths,
    critical_gaps: criticalGaps,
    data_points: totalDataPoints,
  };
}
