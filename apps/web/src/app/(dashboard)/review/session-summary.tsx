"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { PieChart, Pie, Cell } from "recharts";
import {
  ChartContainer,
  type ChartConfig,
} from "@/components/ui/chart";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, RotateCcw, AlertCircle, Check, Zap } from "lucide-react";

interface RatingBreakdown {
  again: number;
  hard: number;
  good: number;
  easy: number;
}

interface SessionSummaryProps {
  reviewed: number;
  correctCount: number;
  ratingBreakdown: RatingBreakdown;
  sessionDurationMs: number;
}

const chartConfig = {
  correct: { label: "Corretos" },
  incorrect: { label: "Errados" },
} satisfies ChartConfig;

const RATING_DISPLAY = [
  { key: "again" as const, label: "De novo", color: "#ef4444", icon: RotateCcw },
  { key: "hard" as const, label: "Difícil", color: "#f97316", icon: AlertCircle },
  { key: "good" as const, label: "Bom", color: "#22c55e", icon: Check },
  { key: "easy" as const, label: "Fácil", color: "#3b82f6", icon: Zap },
];

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes === 0) return `${seconds}s`;
  return `${minutes}m ${seconds}s`;
}

export function SessionSummary({
  reviewed,
  correctCount,
  ratingBreakdown,
  sessionDurationMs,
}: SessionSummaryProps) {
  const router = useRouter();
  const accuracy = reviewed > 0 ? Math.round((correctCount / reviewed) * 100) : 0;
  const incorrectCount = reviewed - correctCount;
  const avgTimeMs = reviewed > 0 ? sessionDurationMs / reviewed : 0;

  const donutData = [
    { name: "Corretos", value: correctCount, color: "#22c55e" },
    { name: "Errados", value: incorrectCount, color: "#ef4444" },
  ];

  const maxRatingCount = Math.max(
    ratingBreakdown.again,
    ratingBreakdown.hard,
    ratingBreakdown.good,
    ratingBreakdown.easy,
    1,
  );

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-card-in">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-brand-50 dark:bg-brand-900/20 mb-2">
          <Trophy className="h-8 w-8 text-brand-500" />
        </div>
        <h2 className="text-2xl font-bold">Sessão Concluída!</h2>
        <p className="text-muted-foreground">
          Você revisou {reviewed} {reviewed === 1 ? "card" : "cards"}
        </p>
      </div>

      {/* Donut + Stats */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
            {/* Donut Chart */}
            <div className="flex justify-center">
              <ChartContainer config={chartConfig} className="h-[180px] w-[180px]">
                <PieChart>
                  <Pie
                    data={donutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    dataKey="value"
                    stroke="none"
                  >
                    {donutData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  {/* Label central */}
                  <text
                    x="50%"
                    y="45%"
                    textAnchor="middle"
                    dominantBaseline="central"
                    className="fill-foreground text-3xl font-bold"
                  >
                    {accuracy}%
                  </text>
                  <text
                    x="50%"
                    y="62%"
                    textAnchor="middle"
                    dominantBaseline="central"
                    className="fill-muted-foreground text-xs"
                  >
                    acerto
                  </text>
                </PieChart>
              </ChartContainer>
            </div>

            {/* Stats */}
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-sm text-muted-foreground">Cards revisados</span>
                <span className="font-semibold">{reviewed}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-sm text-muted-foreground">Corretos</span>
                <span className="font-semibold text-green-600 dark:text-green-400">{correctCount}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-sm text-muted-foreground">Errados</span>
                <span className="font-semibold text-red-600 dark:text-red-400">{incorrectCount}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-muted-foreground">Tempo médio</span>
                <span className="font-semibold">{formatDuration(avgTimeMs)}/card</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rating Breakdown */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Breakdown por Rating
          </h3>
          <div className="space-y-3">
            {RATING_DISPLAY.map(({ key, label, color, icon: Icon }) => {
              const count = ratingBreakdown[key];
              const pct = reviewed > 0 ? Math.round((count / reviewed) * 100) : 0;
              const barWidth = (count / maxRatingCount) * 100;

              return (
                <div key={key} className="flex items-center gap-3">
                  <Icon className="h-4 w-4 shrink-0" style={{ color }} />
                  <span className="text-sm w-16 shrink-0">{label}</span>
                  <div className="flex-1 h-3 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${barWidth}%`, backgroundColor: color }}
                    />
                  </div>
                  <span className="text-sm font-medium w-8 text-right">{count}</span>
                  <span className="text-xs text-muted-foreground w-10 text-right">
                    {pct}%
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-3 justify-center">
        <Button onClick={() => router.refresh()} className="gap-1.5">
          Revisar mais
        </Button>
        <Button variant="outline" asChild>
          <Link href="/dashboard">Voltar ao Dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
