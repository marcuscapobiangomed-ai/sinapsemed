"use client";

import { Bar, BarChart, XAxis, YAxis, Cell } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";
import { getSpecialtyColor } from "@/lib/planner-utils";
import type { SpecialtyAccuracy } from "@/lib/simulation-queries";

const chartConfig = {
  accuracy: {
    label: "Acerto",
  },
} satisfies ChartConfig;

interface SpecialtyBreakdownChartProps {
  data: SpecialtyAccuracy[];
}

export function SpecialtyBreakdownChart({ data }: SpecialtyBreakdownChartProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base font-semibold">
            Acerto por Especialidade
          </CardTitle>
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="flex items-center justify-center py-10">
          <p className="text-sm text-muted-foreground">
            Sem dados ainda
          </p>
        </CardContent>
      </Card>
    );
  }

  const chartData = data.map((d) => ({
    name: d.specialty_name.length > 18 ? d.specialty_name.slice(0, 16) + "..." : d.specialty_name,
    fullName: d.specialty_name,
    accuracy: d.avg_accuracy,
    totalQuestions: d.total_questions,
    totalCorrect: d.total_correct,
    color: getSpecialtyColor(d.specialty_slug),
  }));

  const chartHeight = Math.max(200, data.length * 44 + 40);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-semibold">
          Acerto por Especialidade
        </CardTitle>
        <BarChart3 className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={chartConfig}
          className="w-full"
          style={{ height: `${chartHeight}px`, aspectRatio: "unset" }}
        >
          <BarChart data={chartData} layout="vertical" margin={{ left: 20, right: 30 }}>
            <XAxis
              type="number"
              domain={[0, 100]}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${v}%`}
            />
            <YAxis
              type="category"
              dataKey="name"
              tickLine={false}
              axisLine={false}
              width={120}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value, _name, item) => (
                    <div className="flex flex-col gap-0.5">
                      <span className="font-medium">{item.payload.fullName}</span>
                      <span>{value}% de acerto</span>
                      <span className="text-muted-foreground">
                        {item.payload.totalCorrect}/{item.payload.totalQuestions} questões
                      </span>
                    </div>
                  )}
                />
              }
            />
            <Bar dataKey="accuracy" radius={[0, 4, 4, 0]}>
              {chartData.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
