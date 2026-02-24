"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Target } from "lucide-react";
import type { ApprovalTrendData } from "@/lib/analytics-queries";

const chartConfig = {
  accuracy: {
    label: "Acerto",
    color: "var(--color-primary)",
  },
} satisfies ChartConfig;

function formatDate(dateStr: string): string {
  const [, m, d] = dateStr.split("-");
  return `${d}/${m}`;
}

interface ApprovalTrendChartProps {
  data: ApprovalTrendData;
}

export function ApprovalTrendChart({ data }: ApprovalTrendChartProps) {
  if (data.points.length === 0) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base font-semibold">
            Linha de Tendência de Aprovação
          </CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="flex items-center justify-center py-10">
          <p className="text-sm text-muted-foreground">
            Sem dados de simulados ainda
          </p>
        </CardContent>
      </Card>
    );
  }

  const cutoff = data.cutoff_score ?? 75;
  const hasBanca = data.cutoff_score !== null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-base font-semibold">
            Linha de Tendência de Aprovação
          </CardTitle>
          {hasBanca && (
            <p className="text-xs text-muted-foreground mt-0.5">
              Nota de corte: {cutoff}% ({data.banca_name})
            </p>
          )}
          {!hasBanca && (
            <p className="text-xs text-muted-foreground mt-0.5">
              Selecione uma banca nas configurações para ver zonas de aprovação
            </p>
          )}
        </div>
        <Target className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="aspect-[2.5/1] w-full">
          <LineChart data={data.points} margin={{ left: -20, right: 12, top: 10 }}>
            <CartesianGrid vertical={false} />

            {/* Background zones */}
            {hasBanca && (
              <>
                <ReferenceArea
                  y1={0}
                  y2={60}
                  fill="rgba(239, 68, 68, 0.05)"
                  fillOpacity={1}
                  label={{ value: "Risco", position: "insideBottomLeft", fill: "#ef444480", fontSize: 11 }}
                />
                <ReferenceArea
                  y1={60}
                  y2={cutoff}
                  fill="rgba(245, 158, 11, 0.05)"
                  fillOpacity={1}
                  label={{ value: "Competição", position: "insideBottomLeft", fill: "#f59e0b80", fontSize: 11 }}
                />
                <ReferenceArea
                  y1={cutoff}
                  y2={100}
                  fill="rgba(34, 197, 94, 0.05)"
                  fillOpacity={1}
                  label={{ value: "Aprovação", position: "insideTopLeft", fill: "#22c55e80", fontSize: 11 }}
                />
              </>
            )}

            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <YAxis
              domain={[0, 100]}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${v}%`}
              tickMargin={4}
            />

            {/* Cutoff line */}
            {hasBanca && (
              <ReferenceLine
                y={cutoff}
                stroke="#ef4444"
                strokeDasharray="5 5"
                strokeWidth={1.5}
              />
            )}

            <ChartTooltip
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    if (typeof value === "string") return formatDate(value);
                    return String(value);
                  }}
                  formatter={(value, _name, item) => (
                    <div className="flex flex-col gap-0.5">
                      <span className="font-medium">{value}% de acerto</span>
                      <span className="text-muted-foreground text-xs">
                        {item.payload.title}
                      </span>
                    </div>
                  )}
                />
              }
            />
            <Line
              type="monotone"
              dataKey="accuracy"
              stroke="var(--color-accuracy)"
              strokeWidth={2.5}
              dot={{ r: 4, fill: "var(--color-accuracy)" }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
