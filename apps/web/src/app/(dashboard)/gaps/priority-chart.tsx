"use client";

import { Bar, BarChart, XAxis, YAxis, Cell } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";
import { getSpecialtyColor } from "@/lib/planner-utils";
import type { SpecialtyGap } from "@/lib/gap-queries";

const chartConfig = {
  priority: {
    label: "Prioridade",
  },
} satisfies ChartConfig;

interface PriorityChartProps {
  data: SpecialtyGap[];
  hasBanca: boolean;
}

export function PriorityChart({ data, hasBanca }: PriorityChartProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base font-semibold">
            Prioridade de Estudo
          </CardTitle>
          <AlertTriangle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="flex items-center justify-center py-10">
          <p className="text-sm text-muted-foreground">
            Sem dados ainda
          </p>
        </CardContent>
      </Card>
    );
  }

  // Top 8 por prioridade
  const top = data.slice(0, 8);

  const chartData = top.map((d) => ({
    name: d.specialty_name.length > 18 ? d.specialty_name.slice(0, 16) + "..." : d.specialty_name,
    fullName: d.specialty_name,
    priority: d.priority_score,
    accuracy: d.combined_accuracy,
    weight: Math.round(d.banca_weight * 100),
    color: getSpecialtyColor(d.specialty_slug),
  }));

  const maxPriority = Math.max(...chartData.map((d) => d.priority), 0.1);
  const chartHeight = Math.max(200, top.length * 44 + 40);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-semibold">
          Prioridade de Estudo
        </CardTitle>
        <AlertTriangle className="h-4 w-4 text-muted-foreground" />
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
              domain={[0, Math.ceil(maxPriority * 10) / 10]}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => v.toFixed(2)}
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
                      <span>Prioridade: {Number(value).toFixed(3)}</span>
                      <span>Acerto: {item.payload.accuracy}%</span>
                      {hasBanca && (
                        <span className="text-muted-foreground">
                          Peso na banca: {item.payload.weight}%
                        </span>
                      )}
                    </div>
                  )}
                />
              }
            />
            <Bar dataKey="priority" radius={[0, 4, 4, 0]}>
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
