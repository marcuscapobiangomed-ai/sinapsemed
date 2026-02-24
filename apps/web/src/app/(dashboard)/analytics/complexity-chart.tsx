"use client";

import { Bar, BarChart, CartesianGrid, Legend, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  type ChartConfig,
} from "@/components/ui/chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Layers } from "lucide-react";
import type { ComplexityBreakdownPoint } from "@/lib/analytics-queries";

const chartConfig = {
  easy_correct: { label: "Fácil ✓", color: "#86efac" },
  easy_incorrect: { label: "Fácil ✗", color: "#fca5a5" },
  medium_correct: { label: "Média ✓", color: "#22c55e" },
  medium_incorrect: { label: "Média ✗", color: "#f87171" },
  hard_correct: { label: "Difícil ✓", color: "#15803d" },
  hard_incorrect: { label: "Difícil ✗", color: "#dc2626" },
} satisfies ChartConfig;

function formatDate(dateStr: string): string {
  const [, m, d] = dateStr.split("-");
  return `${d}/${m}`;
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

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-semibold">
          Raio-X de Complexidade
        </CardTitle>
        <Layers className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="aspect-[2/1] w-full">
          <BarChart data={withDifficulty} margin={{ left: -20, right: 12 }}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="exam_date"
              tickFormatter={formatDate}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={4}
            />
            <ChartTooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0]?.payload as ComplexityBreakdownPoint;
                return (
                  <div className="rounded-lg border bg-background p-3 shadow-md text-sm">
                    <p className="font-medium mb-1">{d.title}</p>
                    <div className="space-y-0.5 text-xs">
                      <p>
                        <span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: "#86efac" }} />
                        Fácil: {d.easy_correct}/{d.easy_correct + d.easy_incorrect}
                      </p>
                      <p>
                        <span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: "#22c55e" }} />
                        Média: {d.medium_correct}/{d.medium_correct + d.medium_incorrect}
                      </p>
                      <p>
                        <span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: "#15803d" }} />
                        Difícil: {d.hard_correct}/{d.hard_correct + d.hard_incorrect}
                      </p>
                    </div>
                  </div>
                );
              }}
            />
            <Legend
              formatter={(value: string) => chartConfig[value as keyof typeof chartConfig]?.label ?? value}
            />
            {/* Stack: bottom to top — easy, medium, hard; correct then incorrect in each */}
            <Bar dataKey="easy_correct" stackId="a" fill="#86efac" radius={0} />
            <Bar dataKey="easy_incorrect" stackId="a" fill="#fca5a5" radius={0} />
            <Bar dataKey="medium_correct" stackId="a" fill="#22c55e" radius={0} />
            <Bar dataKey="medium_incorrect" stackId="a" fill="#f87171" radius={0} />
            <Bar dataKey="hard_correct" stackId="a" fill="#15803d" radius={0} />
            <Bar dataKey="hard_incorrect" stackId="a" fill="#dc2626" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
