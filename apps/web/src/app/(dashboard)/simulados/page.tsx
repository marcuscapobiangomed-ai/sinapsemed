import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
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
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = user!.id;

  const [simulations, stats, accuracyTrend, specialtyAccuracy, bancasResult, specialtiesResult, limits, usage] =
    await Promise.all([
      getSimulations(supabase, userId),
      getSimulationStats(supabase, userId),
      getAccuracyTrend(supabase, userId),
      getSpecialtyAccuracy(supabase, userId),
      supabase.from("bancas").select("id, name").order("name"),
      supabase.from("specialties").select("id, name").order("name"),
      getPlanLimits(supabase, userId),
      getUsageCount(supabase, userId),
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
