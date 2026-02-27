"use client";

import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  type ChartConfig,
} from "@/components/ui/chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Layers } from "lucide-react";
import type { ComplexityBreakdownPoint } from "@/lib/analytics-queries";
import { DIFFICULTY_TARGETS } from "@/lib/difficulty-targets";

// Cores quando ACIMA da meta
const HIT_EASY   = "#86efac"; // verde claro
const HIT_MEDIUM = "#22c55e"; // verde
const HIT_HARD   = "#15803d"; // verde escuro

// Cores quando ABAIXO da meta
const MISS_EASY   = "#fca5a5"; // vermelho claro
const MISS_MEDIUM = "#f87171"; // vermelho
const MISS_HARD   = "#dc2626"; // vermelho escuro

const chartConfig = {
  easy:   { label: "Fácil",   color: HIT_EASY   },
  medium: { label: "Média",   color: HIT_MEDIUM },
  hard:   { label: "Difícil", color: HIT_HARD   },
} satisfies ChartConfig;

function truncateTitle(title: string, maxLen = 14): string {
  return title.length > maxLen ? title.slice(0, maxLen) + "…" : title;
}

interface ChartPoint {
  title: string;
  fullTitle: string;
  exam_date: string;
  easy:   number | null;
  medium: number | null;
  hard:   number | null;
  easyRaw: string;
  medRaw:  string;
  hardRaw: string;
  easyTotal: number;
  medTotal:  number;
  hardTotal: number;
}

interface ComplexityChartProps {
  data: ComplexityBreakdownPoint[];
}

export function ComplexityChart({ data }: ComplexityChartProps) {
  const withDifficulty = data.filter((d) => d.has_difficulty_data);

  if (withDifficulty.length === 0) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base font-semibold">
            Raio-X de Complexidade
          </CardTitle>
          <Layers className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="flex items-center justify-center py-10">
          <p className="text-sm text-muted-foreground text-center">
            Registre simulados com detalhamento de dificuldade para ver este gráfico
          </p>
        </CardContent>
      </Card>
    );
  }

  const chartData: ChartPoint[] = withDifficulty.map((d) => {
    const easyTotal = d.easy_correct + d.easy_incorrect;
    const medTotal  = d.medium_correct + d.medium_incorrect;
    const hardTotal = d.hard_correct + d.hard_incorrect;
    return {
      title:     truncateTitle(d.title),
      fullTitle: d.title,
      exam_date: d.exam_date,
      easy:   easyTotal > 0 ? Math.round((d.easy_correct   / easyTotal) * 100) : null,
      medium: medTotal  > 0 ? Math.round((d.medium_correct / medTotal)  * 100) : null,
      hard:   hardTotal > 0 ? Math.round((d.hard_correct   / hardTotal) * 100) : null,
      easyRaw: `${d.easy_correct}/${easyTotal}`,
      medRaw:  `${d.medium_correct}/${medTotal}`,
      hardRaw: `${d.hard_correct}/${hardTotal}`,
      easyTotal,
      medTotal,
      hardTotal,
    };
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-base font-semibold">
            Raio-X de Complexidade
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            Metas: Fácil ≥{DIFFICULTY_TARGETS.easy}% · Média ≥{DIFFICULTY_TARGETS.medium}% · Difícil ≥{DIFFICULTY_TARGETS.hard}%
          </p>
        </div>
        <Layers className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {/* Legenda manual — verde = acima da meta, vermelho = abaixo */}
        <div className="flex items-center gap-4 mb-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: HIT_MEDIUM }} />
            Acima da meta
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: MISS_MEDIUM }} />
            Abaixo da meta
          </span>
          <span className="flex items-center gap-3 ml-auto text-muted-foreground/70">
            <span>Fácil</span>
            <span>Média</span>
            <span>Difícil</span>
          </span>
        </div>

        <ChartContainer config={chartConfig} className="aspect-[2/1] w-full">
          <BarChart
            data={chartData}
            margin={{ left: -20, right: 12 }}
            barCategoryGap="30%"
            barGap={3}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="title"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              interval={0}
              angle={-25}
              textAnchor="end"
              height={55}
              tick={{ fontSize: 11 }}
            />
            <YAxis
              domain={[0, 100]}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${v}%`}
              tickMargin={4}
            />
            <ChartTooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0]?.payload as ChartPoint;
                const [y, m, day] = d.exam_date.split("-");

                const rows: { color: string; label: string; value: number; raw: string; target: number }[] = [];
                if (d.easyTotal > 0 && d.easy !== null)
                  rows.push({ color: d.easy >= DIFFICULTY_TARGETS.easy ? HIT_EASY : MISS_EASY, label: "Fácil", value: d.easy, raw: d.easyRaw, target: DIFFICULTY_TARGETS.easy });
                if (d.medTotal > 0 && d.medium !== null)
                  rows.push({ color: d.medium >= DIFFICULTY_TARGETS.medium ? HIT_MEDIUM : MISS_MEDIUM, label: "Média", value: d.medium, raw: d.medRaw, target: DIFFICULTY_TARGETS.medium });
                if (d.hardTotal > 0 && d.hard !== null)
                  rows.push({ color: d.hard >= DIFFICULTY_TARGETS.hard ? HIT_HARD : MISS_HARD, label: "Difícil", value: d.hard, raw: d.hardRaw, target: DIFFICULTY_TARGETS.hard });

                return (
                  <div className="rounded-lg border bg-background p-3 shadow-md text-sm max-w-[230px]">
                    <p className="font-medium mb-0.5 leading-tight">{d.fullTitle}</p>
                    <p className="text-xs text-muted-foreground mb-2">{`${day}/${m}/${y}`}</p>
                    <div className="space-y-1.5 text-xs">
                      {rows.map((row) => {
                        const hit = row.value >= row.target;
                        return (
                          <div key={row.label} className="flex items-center justify-between gap-3">
                            <span className="flex items-center gap-1.5">
                              <span className="inline-block w-2 h-2 rounded-sm shrink-0" style={{ backgroundColor: row.color }} />
                              <span className="text-muted-foreground">{row.label}</span>
                            </span>
                            <span className="font-semibold tabular-nums">
                              {row.value}%{" "}
                              <span className={hit ? "text-green-600 font-normal" : "text-red-500 font-normal"}>
                                {hit ? "✓" : `✗ meta ${row.target}%`}
                              </span>
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              }}
            />

            {/* Barras com Cell para colorir individualmente por meta */}
            <Bar dataKey="easy" name="easy" radius={[4, 4, 0, 0]} maxBarSize={48}>
              {chartData.map((entry, i) => (
                <Cell
                  key={i}
                  fill={entry.easy === null ? "#e2e8f0" : entry.easy >= DIFFICULTY_TARGETS.easy ? HIT_EASY : MISS_EASY}
                />
              ))}
            </Bar>
            <Bar dataKey="medium" name="medium" radius={[4, 4, 0, 0]} maxBarSize={48}>
              {chartData.map((entry, i) => (
                <Cell
                  key={i}
                  fill={entry.medium === null ? "#e2e8f0" : entry.medium >= DIFFICULTY_TARGETS.medium ? HIT_MEDIUM : MISS_MEDIUM}
                />
              ))}
            </Bar>
            <Bar dataKey="hard" name="hard" radius={[4, 4, 0, 0]} maxBarSize={48}>
              {chartData.map((entry, i) => (
                <Cell
                  key={i}
                  fill={entry.hard === null ? "#e2e8f0" : entry.hard >= DIFFICULTY_TARGETS.hard ? HIT_HARD : MISS_HARD}
                />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
