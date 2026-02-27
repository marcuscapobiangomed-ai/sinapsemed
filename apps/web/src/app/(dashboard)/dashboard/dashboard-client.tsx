"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Layers, Brain, ArrowRight } from "lucide-react";

// Dashboard components
import { StreakCard } from "./streak-card";
import { PredictionCard } from "./prediction-card";
import { AccuracyChart } from "./accuracy-chart";
import { CardStateChart } from "./card-state-chart";
import { HeatmapChart } from "./heatmap-chart";
import { DeckPerformanceChart } from "./deck-performance-chart";
import { DownloadReportButton } from "./download-report-button";

// Analytics components
import { ApprovalTrendChart } from "../analytics/approval-trend-chart";
import { ProficiencyRadarChart } from "../analytics/proficiency-radar-chart";
import { FrictionAlerts } from "../analytics/friction-alerts";
import { ComplexityChart } from "../analytics/complexity-chart";

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
          <h1 className="text-2xl font-bold">Olá, {firstName}!</h1>
          <p className="text-muted-foreground">
            {dueCount > 0
              ? `Você tem ${dueCount} ${dueCount === 1 ? "card" : "cards"} para revisar hoje.`
              : "Tudo em dia! Continue assim."}
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
          <ApprovalTrendChart data={approvalTrendData} />

          <div className="grid gap-4 md:grid-cols-2">
            <ProficiencyRadarChart data={radarData} />
            <FrictionAlerts alerts={frictionAlerts} />
          </div>

          <ComplexityChart data={complexityData} />
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
            <AccuracyChart data={accuracyData} />
          </div>

          {/* Card State */}
          <CardStateChart data={cardStateData} />

          {/* Heatmap */}
          <HeatmapChart data={heatmapData} />

          {/* Deck Performance */}
          <DeckPerformanceChart data={deckPerformanceData} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
