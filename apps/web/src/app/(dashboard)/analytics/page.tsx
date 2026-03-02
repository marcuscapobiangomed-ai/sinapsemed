import { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient, getUser } from "@/lib/supabase/server";
import {
  getComplexityAggregated,
  getApprovalTrendData,
  getRadarData,
  getFrictionAlerts,
} from "@/lib/analytics-queries";
import { AnalyticsDashboard } from "./analytics-dashboard";

export const metadata: Metadata = {
  title: "Análise Avançada | SinapseMED",
};

export default async function AnalyticsPage() {
  const supabase = await createClient();
  const user = await getUser();

  if (!user) redirect("/login");

  const EMPTY_TREND = { points: [], cutoff_score: null, banca_name: null };

  const [complexityData, approvalTrendData, radarData, frictionAlerts] =
    await Promise.all([
      getComplexityAggregated(supabase, user.id).catch(() => []),
      getApprovalTrendData(supabase, user.id).catch(() => EMPTY_TREND),
      getRadarData(supabase, user.id).catch(() => []),
      getFrictionAlerts(supabase, user.id).catch(() => []),
    ]);

  return (
    <AnalyticsDashboard
      complexityData={complexityData}
      approvalTrendData={approvalTrendData}
      radarData={radarData}
      frictionAlerts={frictionAlerts}
    />
  );
}
