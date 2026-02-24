"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays } from "lucide-react";
import type { HeatmapDataPoint } from "@/lib/dashboard-queries";

const MONTHS_PT = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez",
];

const DAYS_PT = ["Dom", "Seg", "", "Qua", "", "Sex", ""];

function getIntensity(count: number): string {
  if (count === 0) return "bg-muted";
  if (count <= 5) return "bg-emerald-200 dark:bg-emerald-900";
  if (count <= 15) return "bg-emerald-400 dark:bg-emerald-700";
  return "bg-emerald-600 dark:bg-emerald-500";
}

interface HeatmapChartProps {
  data: HeatmapDataPoint[];
}

export function HeatmapChart({ data }: HeatmapChartProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base font-semibold">
            Atividade de Estudo
          </CardTitle>
          <CalendarDays className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="flex items-center justify-center py-10">
          <p className="text-sm text-muted-foreground">
            Sem dados ainda
          </p>
        </CardContent>
      </Card>
    );
  }

  // Build a map of date → count
  const countMap = new Map(data.map((d) => [d.date, d.count]));

  // Generate 180 days of cells (26 weeks)
  const today = new Date();
  const cells: { date: string; count: number; dayOfWeek: number }[] = [];

  for (let i = 179; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    cells.push({
      date: dateStr,
      count: countMap.get(dateStr) ?? 0,
      dayOfWeek: d.getDay(),
    });
  }

  // Group into weeks (columns)
  const weeks: typeof cells[] = [];
  let currentWeek: typeof cells = [];

  // Pad first week with empty cells
  const firstDayOfWeek = cells[0].dayOfWeek;
  for (let i = 0; i < firstDayOfWeek; i++) {
    currentWeek.push({ date: "", count: -1, dayOfWeek: i });
  }

  for (const cell of cells) {
    if (cell.dayOfWeek === 0 && currentWeek.length > 0) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
    currentWeek.push(cell);
  }
  if (currentWeek.length > 0) {
    weeks.push(currentWeek);
  }

  // Determine month labels
  const monthLabels: { label: string; weekIndex: number }[] = [];
  let lastMonth = -1;

  weeks.forEach((week, weekIdx) => {
    for (const cell of week) {
      if (cell.date) {
        const month = new Date(cell.date).getMonth();
        if (month !== lastMonth) {
          monthLabels.push({ label: MONTHS_PT[month], weekIndex: weekIdx });
          lastMonth = month;
        }
        break;
      }
    }
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-semibold">
          Atividade de Estudo (6 meses)
        </CardTitle>
        <CalendarDays className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <div className="flex flex-col gap-1">
          {/* Month labels */}
          <div className="flex gap-[3px] ml-8">
            {weeks.map((_, weekIdx) => {
              const label = monthLabels.find((m) => m.weekIndex === weekIdx);
              return (
                <div
                  key={weekIdx}
                  className="w-[13px] text-[10px] text-muted-foreground"
                >
                  {label ? label.label : ""}
                </div>
              );
            })}
          </div>

          {/* Grid: day labels + cells */}
          <div className="flex gap-0">
            {/* Day labels */}
            <div className="flex flex-col gap-[3px] mr-1">
              {DAYS_PT.map((label, i) => (
                <div
                  key={i}
                  className="h-[13px] w-7 text-[10px] text-muted-foreground text-right pr-1 leading-[13px]"
                >
                  {label}
                </div>
              ))}
            </div>

            {/* Weeks */}
            <div className="flex gap-[3px]">
              {weeks.map((week, weekIdx) => (
                <div key={weekIdx} className="flex flex-col gap-[3px]">
                  {week.map((cell, cellIdx) => (
                    <div
                      key={cellIdx}
                      className={`h-[13px] w-[13px] rounded-sm ${
                        cell.count < 0 ? "bg-transparent" : getIntensity(cell.count)
                      }`}
                      title={
                        cell.date
                          ? `${cell.date}: ${cell.count} ${cell.count === 1 ? "revisão" : "revisões"}`
                          : undefined
                      }
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-1 mt-2 ml-8">
            <span className="text-[10px] text-muted-foreground mr-1">Menos</span>
            <div className="h-[10px] w-[10px] rounded-sm bg-muted" />
            <div className="h-[10px] w-[10px] rounded-sm bg-emerald-200 dark:bg-emerald-900" />
            <div className="h-[10px] w-[10px] rounded-sm bg-emerald-400 dark:bg-emerald-700" />
            <div className="h-[10px] w-[10px] rounded-sm bg-emerald-600 dark:bg-emerald-500" />
            <span className="text-[10px] text-muted-foreground ml-1">Mais</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
