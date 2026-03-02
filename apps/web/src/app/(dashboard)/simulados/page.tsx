import { Metadata } from "next";
import { createClient, getUser } from "@/lib/supabase/server";
import {
  getSimulations,
  getSimulationStats,
  getAccuracyTrend,
  getSpecialtyAccuracy,
} from "@/lib/simulation-queries";
import { getPlanLimits, getUsageCount, checkSimulationLimit } from "@/lib/plan-limits";
import { SimulationsDashboard } from "./simulations-dashboard";

export const metadata: Metadata = {
  title: "Simulados",
};

export default async function SimuladosPage() {
  const supabase = await createClient();
  const user = await getUser();
  const userId = user!.id;

  const EMPTY_STATS: import("@/lib/simulation-queries").SimulationStats = { total_count: 0, avg_accuracy: 0, trend: 0, top_source: null };
  const EMPTY_LIMITS: import("@/lib/plan-limits").PlanLimits = { plan_slug: "free", plan_name: "free", max_flashcards_per_month: null, max_doubts_per_day: null, max_bancas: null, max_simulations_per_month: null };
  const EMPTY_USAGE: import("@/lib/plan-limits").UsageCount = { flashcards_this_month: 0, doubts_today: 0, simulations_this_month: 0, bancas_count: 0 };

  const [simulations, stats, accuracyTrend, specialtyAccuracy, bancasResult, specialtiesResult, limits, usage] =
    await Promise.all([
      getSimulations(supabase, userId).catch(() => []),
      getSimulationStats(supabase, userId).catch(() => EMPTY_STATS),
      getAccuracyTrend(supabase, userId).catch(() => []),
      getSpecialtyAccuracy(supabase, userId).catch(() => []),
      supabase.from("bancas").select("id, name").order("name"),
      supabase.from("specialties").select("id, name").order("name"),
      getPlanLimits(supabase, userId).catch(() => EMPTY_LIMITS),
      getUsageCount(supabase, userId).catch(() => EMPTY_USAGE),
    ]);

  const simLimit = checkSimulationLimit(limits, usage);

  return (
    <SimulationsDashboard
      simulations={simulations}
      stats={stats}
      accuracyTrend={accuracyTrend}
      specialtyAccuracy={specialtyAccuracy}
      bancas={(bancasResult.data ?? []) as { id: string; name: string }[]}
      specialties={(specialtiesResult.data ?? []) as { id: string; name: string }[]}
      limitReached={!simLimit.allowed}
      limitInfo={simLimit.limit !== null ? `${simLimit.current}/${simLimit.limit} este mês (${simLimit.plan_name})` : undefined}
    />
  );
}
