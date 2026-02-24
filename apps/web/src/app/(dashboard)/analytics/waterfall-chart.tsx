"use client";

import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis, ReferenceLine } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  type ChartConfig,
} from "@/components/ui/chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRightLeft } from "lucide-react";
import type { WaterfallData } from "@/lib/analytics-queries";

const chartConfig = {
  visible: { label: "Delta", color: "var(--color-primary)" },
} satisfies ChartConfig;

interface WaterfallChartProps {
  data: WaterfallData | null;
}

export function WaterfallChart({ data }: WaterfallChartProps) {
  if (!data) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base font-semibold">
            Cascata de Desempenho
          </CardTitle>
          <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="flex items-center justify-center py-10">
          <p className="text-sm text-muted-foreground text-center">
            Registre pelo menos 2 simulados com breakdown por especialidade
          </p>
        </CardContent>
      </Card>
    );
  }

  // Transform data for stacked bar waterfall
  // Each bar has an invisible "base" and a visible "delta"
  const chartData = data.segments.map((seg) => ({
    name: seg.name,
    base: seg.type === "total" ? 0 : seg.start,
    visible: seg.type === "total" ? seg.end : Math.abs(seg.value),
    type: seg.type,
    value: seg.value,
    start: seg.start,
    end: seg.end,
  }));

  function getBarColor(type: string): string {
    if (type === "gain") return "#22c55e";
    if (type === "loss") return "#ef4444";
    return "var(--color-primary)";
  }

  const diff = data.sim_b.accuracy - data.sim_a.accuracy;
  const diffLabel = diff >= 0 ? `+${diff}pp` : `${diff}pp`;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-base font-semibold">
            Cascata de Desempenho
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            {data.sim_a.title} → {data.sim_b.title}{" "}
            <span className={diff >= 0 ? "text-green-600" : "text-red-600"}>
              ({diffLabel})
            </span>
          </p>
        </div>
        <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="aspect-[2/1] w-full">
          <BarChart data={chartData} margin={{ left: -20, right: 12 }}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="name"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tick={{ fontSize: 11 }}
              interval={0}
              angle={-30}
              textAnchor="end"
              height={60}
            />
            <YAxis
              domain={[0, 100]}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${v}%`}
              tickMargin={4}
            />
            <ReferenceLine y={0} stroke="var(--color-border)" />
            <ChartTooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0]?.payload;
                if (!d) return null;
                return (
                  <div className="rounded-lg border bg-background p-2.5 shadow-md text-sm">
                    <p className="font-medium">{d.name}</p>
                    {d.type === "total" ? (
                      <p className="text-xs">{d.visible}%</p>
                    ) : (
                      <p className="text-xs">
                        {d.value >= 0 ? "+" : ""}{d.value}pp
                      </p>
                    )}
                  </div>
                );
              }}
            />
            {/* Invisible base */}
            <Bar dataKey="base" stackId="waterfall" fill="transparent" radius={0} />
            {/* Visible delta */}
            <Bar dataKey="visible" stackId="waterfall" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={index} fill={getBarColor(entry.type)} />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
