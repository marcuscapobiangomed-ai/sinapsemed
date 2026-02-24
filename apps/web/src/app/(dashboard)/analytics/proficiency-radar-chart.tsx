"use client";

import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  type ChartConfig,
} from "@/components/ui/chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Hexagon } from "lucide-react";
import type { RadarPoint } from "@/lib/analytics-queries";

const chartConfig = {
  accuracy: {
    label: "Proficiência",
    color: "var(--color-primary)",
  },
} satisfies ChartConfig;

interface ProficiencyRadarChartProps {
  data: RadarPoint[];
}

export function ProficiencyRadarChart({ data }: ProficiencyRadarChartProps) {
  const hasData = data.some((d) => d.total_questions > 0);

  if (!hasData) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base font-semibold">
            Teia de Proficiência
          </CardTitle>
          <Hexagon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="flex items-center justify-center py-10">
          <p className="text-sm text-muted-foreground text-center">
            Registre simulados ou revisões para ver a teia de proficiência
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-semibold">
          Teia de Proficiência
        </CardTitle>
        <Hexagon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[300px]">
          <RadarChart data={data} cx="50%" cy="50%" outerRadius="80%">
            <PolarGrid gridType="polygon" />
            <PolarAngleAxis
              dataKey="area"
              tick={{ fontSize: 12, fill: "var(--color-foreground)" }}
            />
            <PolarRadiusAxis
              domain={[0, 100]}
              tickCount={5}
              tick={{ fontSize: 10 }}
              axisLine={false}
            />
            <ChartTooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0]?.payload as RadarPoint;
                return (
                  <div className="rounded-lg border bg-background p-2.5 shadow-md text-sm">
                    <p className="font-medium">{d.area}</p>
                    <p className="text-xs">{d.accuracy}% de acerto</p>
                    <p className="text-xs text-muted-foreground">
                      {d.total_questions} questões
                    </p>
                  </div>
                );
              }}
            />
            <Radar
              name="accuracy"
              dataKey="accuracy"
              stroke="var(--color-accuracy)"
              fill="var(--color-accuracy)"
              fillOpacity={0.2}
              strokeWidth={2}
              dot={{ r: 3, fill: "var(--color-accuracy)" }}
            />
          </RadarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
