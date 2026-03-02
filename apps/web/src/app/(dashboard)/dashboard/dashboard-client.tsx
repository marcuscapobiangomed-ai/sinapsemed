"use client";

import { lazy, Suspense } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Layers, Brain, ArrowRight, Loader2 } from "lucide-react";

// Non-chart components (small, always visible)
import { StreakCard } from "./streak-card";
import { PredictionCard } from "./prediction-card";
import { DownloadReportButton } from "./download-report-button";

// Lazy-loaded chart components (recharts ~100KB — only loaded when tab renders)
const AccuracyChart = lazy(() => import("./accuracy-chart").then(m => ({ default: m.AccuracyChart })));
const CardStateChart = lazy(() => import("./card-state-chart").then(m => ({ default: m.CardStateChart })));
const HeatmapChart = lazy(() => import("./heatmap-chart").then(m => ({ default: m.HeatmapChart })));
const DeckPerformanceChart = lazy(() => import("./deck-performance-chart").then(m => ({ default: m.DeckPerformanceChart })));
const ApprovalTrendChart = lazy(() => import("../analytics/approval-trend-chart").then(m => ({ default: m.ApprovalTrendChart })));
const ProficiencyRadarChart = lazy(() => import("../analytics/proficiency-radar-chart").then(m => ({ default: m.ProficiencyRadarChart })));
const FrictionAlerts = lazy(() => import("../analytics/friction-alerts").then(m => ({ default: m.FrictionAlerts })));
const ComplexityChart = lazy(() => import("../analytics/complexity-chart").then(m => ({ default: m.ComplexityChart })));

function ChartFallback() {
  return (
    <div className="flex items-center justify-center h-48 rounded-lg border bg-muted/20">
      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
    </div>
  );
}

// Types
import type {
  AccuracyDataPoint,
  HeatmapDataPoint,
  CardStateData,
  DeckPerformanceData,
} from "@/lib/dashboard-queries";
import type { ApprovalPrediction } from "@/lib/prediction-queries";
import type {
  ComplexityAreaPoint,
  ApprovalTrendData,
  RadarPoint,
  FrictionAlert,
} from "@/lib/analytics-queries";

interface DashboardClientProps {
  firstName: string;
  dueCount: number;
  decksCount: number;
  flashcardsCount: number;
  streak: number;
  accuracyData: AccuracyDataPoint[];
  heatmapData: HeatmapDataPoint[];
  cardStateData: CardStateData[];
  deckPerformanceData: DeckPerformanceData[];
  prediction: ApprovalPrediction;
  complexityData: ComplexityAreaPoint[];
  approvalTrendData: ApprovalTrendData;
  radarData: RadarPoint[];
  frictionAlerts: FrictionAlert[];
}

export function DashboardClient({
  firstName,
  dueCount,
  decksCount,
  flashcardsCount,
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
}: DashboardClientProps) {
  return (
    <div className="space-y-6">
      {/* Header — sempre visível */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Desempenho</h1>
          <p className="text-muted-foreground">
            {dueCount > 0
              ? `${firstName}, você tem ${dueCount} ${dueCount === 1 ? "card" : "cards"} para revisar hoje.`
              : `${firstName}, tudo em dia! Continue assim.`}
          </p>
        </div>
        <DownloadReportButton />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="analise">
        <TabsList className="mb-2">
          <TabsTrigger value="analise">Análise</TabsTrigger>
          <TabsTrigger value="flashcards">Flashcards</TabsTrigger>
        </TabsList>

        {/* ── Aba Análise ── */}
        <TabsContent value="analise" className="space-y-6 mt-0">
          <Suspense fallback={<ChartFallback />}>
            <ApprovalTrendChart data={approvalTrendData} />
          </Suspense>

          <div className="grid gap-4 md:grid-cols-2">
            <Suspense fallback={<ChartFallback />}>
              <ProficiencyRadarChart data={radarData} />
            </Suspense>
            <Suspense fallback={<ChartFallback />}>
              <FrictionAlerts alerts={frictionAlerts} />
            </Suspense>
          </div>

          <Suspense fallback={<ChartFallback />}>
            <ComplexityChart data={complexityData} />
          </Suspense>
        </TabsContent>

        {/* ── Aba Flashcards ── */}
        <TabsContent value="flashcards" className="space-y-6 mt-0">
          {/* Stat Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Decks</CardTitle>
                <Layers className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{decksCount}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Flashcards</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{flashcardsCount}</p>
              </CardContent>
            </Card>

            <Card className={dueCount > 0 ? "border-primary/40 bg-primary/5" : ""}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Para revisar hoje
                </CardTitle>
                <Brain className={`h-4 w-4 ${dueCount > 0 ? "text-primary" : "text-muted-foreground"}`} />
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-2xl font-bold">{dueCount}</p>
                {dueCount > 0 && (
                  <Button asChild size="sm" className="w-full gap-1.5 text-xs h-7">
                    <Link href="/review">
                      Revisar agora
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </Button>
                )}
              </CardContent>
            </Card>

            <StreakCard streak={streak} />
          </div>

          {/* Prediction + Accuracy */}
          <div className="grid gap-4 md:grid-cols-2">
            <PredictionCard prediction={prediction} />
            <Suspense fallback={<ChartFallback />}>
              <AccuracyChart data={accuracyData} />
            </Suspense>
          </div>

          {/* Card State */}
          <Suspense fallback={<ChartFallback />}>
            <CardStateChart data={cardStateData} />
          </Suspense>

          {/* Heatmap */}
          <Suspense fallback={<ChartFallback />}>
            <HeatmapChart data={heatmapData} />
          </Suspense>

          {/* Deck Performance */}
          <Suspense fallback={<ChartFallback />}>
            <DeckPerformanceChart data={deckPerformanceData} />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}
