"use client";

import { Bar, BarChart, CartesianGrid, Legend, ReferenceLine, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  type ChartConfig,
} from "@/components/ui/chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Layers } from "lucide-react";
import type { ComplexityBreakdownPoint } from "@/lib/analytics-queries";

// Três séries: % de acerto por nível de dificuldade
const chartConfig = {
  easy: { label: "Fácil", color: "#86efac" },
  medium: { label: "Média", color: "#22c55e" },
  hard: { label: "Difícil", color: "#15803d" },
} satisfies ChartConfig;

function truncateTitle(title: string, maxLen = 14): string {
  return title.length > maxLen ? title.slice(0, maxLen) + "…" : title;
}

interface ChartPoint {
  title: string;
  fullTitle: string;
  exam_date: string;
  easy: number | null;
  medium: number | null;
  hard: number | null;
  easyRaw: string;
  medRaw: string;
  hardRaw: string;
  easyTotal: number;
  medTotal: number;
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

  // Transforma em % de acerto por nível — o que o gráfico deve responder:
  // "Estou acertando X% das fáceis, Y% das médias, Z% das difíceis?"
  const chartData: ChartPoint[] = withDifficulty.map((d) => {
    const easyTotal = d.easy_correct + d.easy_incorrect;
    const medTotal = d.medium_correct + d.medium_incorrect;
    const hardTotal = d.hard_correct + d.hard_incorrect;
    return {
      title: truncateTitle(d.title),
      fullTitle: d.title,
      exam_date: d.exam_date,
      easy: easyTotal > 0 ? Math.round((d.easy_correct / easyTotal) * 100) : null,
      medium: medTotal > 0 ? Math.round((d.medium_correct / medTotal) * 100) : null,
      hard: hardTotal > 0 ? Math.round((d.hard_correct / hardTotal) * 100) : null,
      easyRaw: `${d.easy_correct}/${easyTotal}`,
      medRaw: `${d.medium_correct}/${medTotal}`,
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
            % de acerto por nível de dificuldade
          </p>
        </div>
        <Layers className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
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
            {/* Linha de referência em 50% — abaixo disso, está errando mais do que acertando */}
            <ReferenceLine
              y={50}
              stroke="var(--border)"
              strokeDasharray="4 4"
              label={{ value: "50%", position: "insideTopRight", fontSize: 10, fill: "var(--muted-foreground)" }}
            />
            <ChartTooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0]?.payload as ChartPoint;
                const [y, m, day] = d.exam_date.split("-");
                return (
                  <div className="rounded-lg border bg-background p-3 shadow-md text-sm max-w-[220px]">
                    <p className="font-medium mb-0.5 leading-tight">{d.fullTitle}</p>
                    <p className="text-xs text-muted-foreground mb-2">{`${day}/${m}/${y}`}</p>
                    <div className="space-y-1.5 text-xs">
                      {d.easyTotal > 0 && (
                        <div className="flex items-center justify-between gap-3">
                          <span className="flex items-center gap-1.5">
                            <span className="inline-block w-2 h-2 rounded-sm shrink-0" style={{ backgroundColor: "#86efac" }} />
                            <span className="text-muted-foreground">Fácil</span>
                          </span>
                          <span className="font-semibold">
                            {d.easy}% <span className="font-normal text-muted-foreground">({d.easyRaw})</span>
                          </span>
                        </div>
                      )}
                      {d.medTotal > 0 && (
                        <div className="flex items-center justify-between gap-3">
                          <span className="flex items-center gap-1.5">
                            <span className="inline-block w-2 h-2 rounded-sm shrink-0" style={{ backgroundColor: "#22c55e" }} />
                            <span className="text-muted-foreground">Média</span>
                          </span>
                          <span className="font-semibold">
                            {d.medium}% <span className="font-normal text-muted-foreground">({d.medRaw})</span>
                          </span>
                        </div>
                      )}
                      {d.hardTotal > 0 && (
                        <div className="flex items-center justify-between gap-3">
                          <span className="flex items-center gap-1.5">
                            <span className="inline-block w-2 h-2 rounded-sm shrink-0" style={{ backgroundColor: "#15803d" }} />
                            <span className="text-muted-foreground">Difícil</span>
                          </span>
                          <span className="font-semibold">
                            {d.hard}% <span className="font-normal text-muted-foreground">({d.hardRaw})</span>
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              }}
            />
            <Legend
              formatter={(value: string) => chartConfig[value as keyof typeof chartConfig]?.label ?? value}
              wrapperStyle={{ fontSize: 12 }}
            />
            <Bar dataKey="easy" name="easy" fill="#86efac" radius={[4, 4, 0, 0]} maxBarSize={48} />
            <Bar dataKey="medium" name="medium" fill="#22c55e" radius={[4, 4, 0, 0]} maxBarSize={48} />
            <Bar dataKey="hard" name="hard" fill="#15803d" radius={[4, 4, 0, 0]} maxBarSize={48} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
