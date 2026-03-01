"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Clock, BookOpen, BarChart2, Target } from "lucide-react";
import type { Sprint } from "@/lib/sprint-queries";
import { SPRINT_TYPE_LABELS } from "@/lib/sprint-queries";

interface SprintReportProps {
  sprint: Sprint;
}

interface DiagnosticData {
  overall_accuracy: number;
  specialties: Array<{
    specialty_name: string;
    specialty_slug: string;
    combined_accuracy: number;
  }>;
}

export function SprintReport({ sprint }: SprintReportProps) {
  const diagStart = sprint.diagnostic_start as DiagnosticData | null;
  const diagEnd = sprint.diagnostic_end as DiagnosticData | null;

  const overallDelta =
    diagStart && diagEnd
      ? diagEnd.overall_accuracy - diagStart.overall_accuracy
      : null;

  // Build specialty comparison
  const specialtyComparison: Array<{
    name: string;
    start: number;
    end: number;
    delta: number;
  }> = [];

  if (diagStart?.specialties && diagEnd?.specialties) {
    const endMap = new Map(
      diagEnd.specialties.map((s) => [s.specialty_slug, s.combined_accuracy]),
    );

    for (const s of diagStart.specialties) {
      const endAcc = endMap.get(s.specialty_slug);
      if (endAcc != null) {
        specialtyComparison.push({
          name: s.specialty_name,
          start: s.combined_accuracy,
          end: endAcc,
          delta: endAcc - s.combined_accuracy,
        });
      }
    }

    specialtyComparison.sort((a, b) => b.delta - a.delta);
  }

  const totalDays = Math.round(
    (new Date(sprint.end_date).getTime() -
      new Date(sprint.start_date).getTime()) /
      (1000 * 60 * 60 * 24),
  ) + 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader className="pb-3 text-center">
          <CardTitle className="text-xl">
            Relatorio — {sprint.title}
          </CardTitle>
          <div className="flex items-center justify-center gap-2 mt-1">
            <Badge variant="secondary">
              {SPRINT_TYPE_LABELS[sprint.sprint_type]}
            </Badge>
            <Badge variant="outline">{totalDays} dias</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {/* Stats grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center">
              <Clock className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
              <p className="text-xl font-bold">
                {Math.round(sprint.total_study_minutes / 60)}h
              </p>
              <p className="text-xs text-muted-foreground">Estudadas</p>
            </div>
            <div className="text-center">
              <BookOpen className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
              <p className="text-xl font-bold">{sprint.total_reviews}</p>
              <p className="text-xs text-muted-foreground">Cards revisados</p>
            </div>
            <div className="text-center">
              <BarChart2 className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
              <p className="text-xl font-bold">{sprint.total_simulations}</p>
              <p className="text-xs text-muted-foreground">Simulados</p>
            </div>
            <div className="text-center">
              <Target className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
              <p className="text-xl font-bold">
                {sprint.avg_accuracy != null
                  ? `${Math.round(sprint.avg_accuracy)}%`
                  : "—"}
              </p>
              <p className="text-xs text-muted-foreground">Acerto medio</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Overall delta */}
      {overallDelta !== null && (
        <Card
          className={
            overallDelta >= 0 ? "border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/20" : ""
          }
        >
          <CardContent className="flex items-center justify-center gap-3 py-6">
            {overallDelta >= 0 ? (
              <TrendingUp className="h-8 w-8 text-green-600" />
            ) : (
              <TrendingDown className="h-8 w-8 text-red-500" />
            )}
            <div className="text-center">
              <p
                className={`text-3xl font-bold ${
                  overallDelta >= 0 ? "text-green-600" : "text-red-500"
                }`}
              >
                {overallDelta >= 0 ? "+" : ""}
                {Math.round(overallDelta)}pp
              </p>
              <p className="text-sm text-muted-foreground">
                Evolucao geral no Sprint
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Specialty comparison table */}
      {specialtyComparison.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              Evolucao por especialidade
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="grid grid-cols-4 gap-2 text-xs text-muted-foreground font-medium pb-2 border-b">
                <span>Especialidade</span>
                <span className="text-right">Inicio</span>
                <span className="text-right">Fim</span>
                <span className="text-right">Delta</span>
              </div>
              {specialtyComparison.slice(0, 10).map((s) => (
                <div
                  key={s.name}
                  className="grid grid-cols-4 gap-2 text-sm items-center"
                >
                  <span className="font-medium truncate">{s.name}</span>
                  <span className="text-right text-muted-foreground">
                    {s.start}%
                  </span>
                  <span className="text-right">{s.end}%</span>
                  <span
                    className={`text-right font-semibold ${
                      s.delta >= 0 ? "text-green-600" : "text-red-500"
                    }`}
                  >
                    {s.delta >= 0 ? "+" : ""}
                    {Math.round(s.delta)}pp
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
