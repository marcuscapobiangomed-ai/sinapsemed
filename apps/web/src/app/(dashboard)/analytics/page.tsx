import { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  getComplexityBreakdown,
  getPerformanceWaterfall,
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
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [complexityData, waterfallData, approvalTrendData, radarData, frictionAlerts] =
    await Promise.all([
      getComplexityBreakdown(supabase, user.id),
      getPerformanceWaterfall(supabase, user.id),
      getApprovalTrendData(supabase, user.id),
      getRadarData(supabase, user.id),
      getFrictionAlerts(supabase, user.id),
    ]);

  return (
    <AnalyticsDashboard
      complexityData={complexityData}
      waterfallData={waterfallData}
      approvalTrendData={approvalTrendData}
      radarData={radarData}
      frictionAlerts={frictionAlerts}
    />
  );
}
