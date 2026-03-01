"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2 } from "lucide-react";
import type { Sprint } from "@/lib/sprint-queries";
import { SPRINT_TYPE_LABELS } from "@/lib/sprint-queries";

interface SprintHistoryProps {
  sprints: Sprint[];
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

function computeDelta(sprint: Sprint): number | null {
  if (!sprint.diagnostic_start || !sprint.diagnostic_end) return null;
  const start = (sprint.diagnostic_start as { overall_accuracy?: number }).overall_accuracy;
  const end = (sprint.diagnostic_end as { overall_accuracy?: number }).overall_accuracy;
  if (start == null || end == null) return null;
  return Math.round(end - start);
}

export function SprintHistory({ sprints }: SprintHistoryProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Historico de Sprints</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sprints.map((sprint) => {
            const delta = computeDelta(sprint);
            const totalDays = Math.round(
              (new Date(sprint.end_date).getTime() -
                new Date(sprint.start_date).getTime()) /
                (1000 * 60 * 60 * 24),
            ) + 1;

            return (
              <div
                key={sprint.id}
                className="flex items-center gap-3 rounded-lg border p-3"
              >
                <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{sprint.title}</p>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                    <Badge variant="secondary" className="text-[10px]">
                      {SPRINT_TYPE_LABELS[sprint.sprint_type]}
                    </Badge>
                    <span>{totalDays} dias</span>
                    <span>
                      {formatDate(sprint.start_date)} - {formatDate(sprint.end_date)}
                    </span>
                  </div>
                </div>
                {delta !== null && (
                  <span
                    className={`text-sm font-bold shrink-0 ${
                      delta >= 0 ? "text-green-600" : "text-red-500"
                    }`}
                  >
                    {delta >= 0 ? "+" : ""}
                    {delta}pp
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
