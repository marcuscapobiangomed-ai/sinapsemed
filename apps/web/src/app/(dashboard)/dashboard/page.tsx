import { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Layers, Brain, ArrowRight } from "lucide-react";
import {
  getStreak,
  getAccuracyOverTime,
  getHeatmapData,
  getCardStateDistribution,
  getDeckPerformance,
} from "@/lib/dashboard-queries";
import { getApprovalPrediction } from "@/lib/prediction-queries";
import { StreakCard } from "./streak-card";
import { PredictionCard } from "./prediction-card";
import { AccuracyChart } from "./accuracy-chart";
import { CardStateChart } from "./card-state-chart";
import { HeatmapChart } from "./heatmap-chart";
import { DeckPerformanceChart } from "./deck-performance-chart";
import { DownloadReportButton } from "./download-report-button";

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
  ]);

  const firstName = profileResult.data?.full_name?.split(" ")[0] ?? "Estudante";
  const dueCount = dueResult.count ?? 0;

  return (
    <div className="space-y-6">
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

      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Decks</CardTitle>
            <Layers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{decksResult.count ?? 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Flashcards</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{flashcardsResult.count ?? 0}</p>
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

      {/* Prediction + Charts Row */}
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
    </div>
  );
}
