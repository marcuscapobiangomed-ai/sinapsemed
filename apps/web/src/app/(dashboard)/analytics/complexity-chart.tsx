"use client";

import { useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, LabelList, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, type ChartConfig } from "@/components/ui/chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Layers } from "lucide-react";
import type { ComplexityAreaPoint } from "@/lib/analytics-queries";
import { DIFFICULTY_TARGETS } from "@/lib/difficulty-targets";

// ── cores ──────────────────────────────────────────
const HIT_EASY   = "#86efac"; // verde claro — fácil atingido
const HIT_MED    = "#22c55e"; // verde — média atingido
const HIT_HARD   = "#15803d"; // verde escuro — difícil atingido
const MISS_EASY  = "#fca5a5"; // vermelho claro — fácil perdido
const MISS_MED   = "#f87171"; // vermelho — média perdida
const MISS_HARD  = "#dc2626"; // vermelho escuro — difícil perdido
const NO_DATA    = "#e2e8f0"; // cinza — sem dados

const chartConfig = {
  pct: { label: "Acerto", color: HIT_MED },
} satisfies ChartConfig;

interface BarDatum {
  level: "Fácil" | "Média" | "Difícil";
  pct:    number | null; // % de acerto (null = sem dados)
  total:  number;
  correct: number;
  target: number;
  hitColor:  string;
  missColor: string;
}

interface ComplexityChartProps {
  data: ComplexityAreaPoint[];
}

export function ComplexityChart({ data }: ComplexityChartProps) {
  const [selectedArea, setSelectedArea] = useState("all");

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base font-semibold">Raio-X de Complexidade</CardTitle>
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

  const point = data.find((d) => d.area_slug === selectedArea) ?? data[0];

  const pct = (correct: number, total: number): number | null =>
    total > 0 ? Math.round((correct / total) * 100) : null;

  const easyPct   = pct(point.easy_correct,   point.easy_total);
  const medPct    = pct(point.medium_correct,  point.medium_total);
  const hardPct   = pct(point.hard_correct,    point.hard_total);

  const barData: BarDatum[] = [
    {
      level: "Fácil",
      pct: easyPct,
      total: point.easy_total,
      correct: point.easy_correct,
      target: DIFFICULTY_TARGETS.easy,
      hitColor:  HIT_EASY,
      missColor: MISS_EASY,
    },
    {
      level: "Média",
      pct: medPct,
      total: point.medium_total,
      correct: point.medium_correct,
      target: DIFFICULTY_TARGETS.medium,
      hitColor:  HIT_MED,
      missColor: MISS_MED,
    },
    {
      level: "Difícil",
      pct: hardPct,
      total: point.hard_total,
      correct: point.hard_correct,
      target: DIFFICULTY_TARGETS.hard,
      hitColor:  HIT_HARD,
      missColor: MISS_HARD,
    },
  ];

  // Recharts precisa de um valor numérico para renderizar a barra;
  // usamos 0 quando sem dados (cor cinza)
  const chartData = barData.map((d) => ({ ...d, value: d.pct ?? 0 }));

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold">Raio-X de Complexidade</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Metas: Fácil ≥{DIFFICULTY_TARGETS.easy}% · Média ≥{DIFFICULTY_TARGETS.medium}% · Difícil ≥{DIFFICULTY_TARGETS.hard}%
            </p>
          </div>
          <Layers className="h-4 w-4 text-muted-foreground shrink-0" />
        </div>

        {/* Seletor de grande área */}
        <div className="flex flex-wrap gap-1.5 mt-3">
          {data.map((area) => (
            <button
              key={area.area_slug}
              onClick={() => setSelectedArea(area.area_slug)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                selectedArea === area.area_slug
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {area.area_name}
              <span className="ml-1 opacity-60">({area.sim_count})</span>
            </button>
          ))}
        </div>
      </CardHeader>

      <CardContent>
        {/* Legenda inline */}
        <div className="flex items-center gap-4 mb-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: HIT_MED }} />
            Acima da meta
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: MISS_MED }} />
            Abaixo da meta
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: NO_DATA }} />
            Sem dados
          </span>
        </div>

        <ChartContainer config={chartConfig} className="aspect-[3/2] w-full max-h-[260px]">
          <BarChart data={chartData} margin={{ left: -20, right: 12, top: 24, bottom: 4 }} barCategoryGap="35%">
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="level"
              tickLine={false}
              axisLine={false}
              tickMargin={10}
              tick={{ fontSize: 13, fontWeight: 500 }}
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
                const d = payload[0]?.payload as BarDatum & { value: number };
                if (d.total === 0) {
                  return (
                    <div className="rounded-lg border bg-background p-3 shadow-md text-sm">
                      <p className="font-medium">{d.level}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Sem questões registradas para este nível
                      </p>
                    </div>
                  );
                }
                const hit = d.pct !== null && d.pct >= d.target;
                return (
                  <div className="rounded-lg border bg-background p-3 shadow-md text-sm">
                    <p className="font-medium mb-2">{d.level}</p>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between gap-6">
                        <span className="text-muted-foreground">Acerto</span>
                        <span className="font-semibold">{d.pct}% ({d.correct}/{d.total})</span>
                      </div>
                      <div className="flex justify-between gap-6">
                        <span className="text-muted-foreground">Meta</span>
                        <span>{d.target}%</span>
                      </div>
                      <div className="flex justify-between gap-6 pt-1 border-t">
                        <span className="text-muted-foreground">Status</span>
                        <span className={hit ? "text-green-600 font-medium" : "text-red-500 font-medium"}>
                          {hit
                            ? "✓ Atingida"
                            : `✗ Faltam ${d.target - (d.pct ?? 0)}pp`}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              }}
            />
            <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={80}>
              {chartData.map((entry, i) => (
                <Cell
                  key={i}
                  fill={
                    entry.total === 0
                      ? NO_DATA
                      : entry.pct !== null && entry.pct >= entry.target
                        ? entry.hitColor
                        : entry.missColor
                  }
                />
              ))}
              {/* Rótulo com % acima de cada barra */}
              <LabelList
                content={({ x, y, width, index }) => {
                  if (index === undefined) return null;
                  const entry = chartData[index];
                  if (!entry) return null;
                  const label = entry.total === 0 ? "—" : `${entry.pct}%`;
                  return (
                    <text
                      x={Number(x) + Number(width) / 2}
                      y={Number(y) - 8}
                      textAnchor="middle"
                      fontSize={13}
                      fontWeight={600}
                      fill="currentColor"
                    >
                      {label}
                    </text>
                  );
                }}
              />
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
