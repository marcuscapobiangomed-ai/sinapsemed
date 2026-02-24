"use client";

import { ApprovalTrendChart } from "./approval-trend-chart";
import { ProficiencyRadarChart } from "./proficiency-radar-chart";
import { FrictionAlerts } from "./friction-alerts";
import { ComplexityChart } from "./complexity-chart";
import { WaterfallChart } from "./waterfall-chart";
import type {
  ComplexityBreakdownPoint,
  WaterfallData,
  ApprovalTrendData,
  RadarPoint,
  FrictionAlert,
} from "@/lib/analytics-queries";

interface AnalyticsDashboardProps {
  complexityData: ComplexityBreakdownPoint[];
  waterfallData: WaterfallData | null;
  approvalTrendData: ApprovalTrendData;
  radarData: RadarPoint[];
  frictionAlerts: FrictionAlert[];
}

export function AnalyticsDashboard({
  complexityData,
  waterfallData,
  approvalTrendData,
  radarData,
  frictionAlerts,
}: AnalyticsDashboardProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Análise Avançada</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Transforme seus dados em insights acionáveis
        </p>
      </div>

      {/* Row 1: Approval Trend — full width */}
      <ApprovalTrendChart data={approvalTrendData} />

      {/* Row 2: Radar + Friction Alerts — 2 columns */}
      <div className="grid gap-4 md:grid-cols-2">
        <ProficiencyRadarChart data={radarData} />
        <FrictionAlerts alerts={frictionAlerts} />
      </div>

      {/* Row 3: Complexity X-Ray — full width */}
      <ComplexityChart data={complexityData} />

      {/* Row 4: Performance Waterfall — full width */}
      <WaterfallChart data={waterfallData} />
    </div>
  );
}
