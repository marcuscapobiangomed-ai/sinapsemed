"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle, Rocket, Target, Clock, BookOpen, BarChart2 } from "lucide-react";
import type { Sprint, SprintGoal } from "@/lib/sprint-queries";
import {
  getSprintProgress,
  SPRINT_TYPE_LABELS,
  SPRINT_PHASE_LABELS,
} from "@/lib/sprint-queries";

interface SprintDashboardProps {
  sprint: Sprint;
  goals: SprintGoal[];
}

export function SprintDashboard({ sprint, goals }: SprintDashboardProps) {
  const progress = getSprintProgress(sprint);
  const completedGoals = goals.filter((g) => g.is_completed).length;

  return (
    <div className="space-y-6">
      {/* Main sprint card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <Rocket className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">{sprint.title}</CardTitle>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge variant="secondary" className="text-xs">
                    {SPRINT_TYPE_LABELS[sprint.sprint_type]}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {SPRINT_PHASE_LABELS[sprint.current_phase]}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-primary">
                Dia {progress.dayNumber}
              </p>
              <p className="text-xs text-muted-foreground">
                de {progress.totalDays}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Progress bar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Progresso do Sprint</span>
              <span>{progress.progressPercent}%</span>
            </div>
            <div className="h-3 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${progress.progressPercent}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {progress.daysRemaining} dias restantes
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Clock className="h-4 w-4" />
              <span className="text-xs">Tempo estudado</span>
            </div>
            <p className="text-xl font-bold">
              {Math.round(sprint.total_study_minutes / 60)}h
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <BookOpen className="h-4 w-4" />
              <span className="text-xs">Cards revisados</span>
            </div>
            <p className="text-xl font-bold">{sprint.total_reviews}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <BarChart2 className="h-4 w-4" />
              <span className="text-xs">Simulados</span>
            </div>
            <p className="text-xl font-bold">{sprint.total_simulations}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Target className="h-4 w-4" />
              <span className="text-xs">Acerto medio</span>
            </div>
            <p className="text-xl font-bold">
              {sprint.avg_accuracy != null
                ? `${Math.round(sprint.avg_accuracy)}%`
                : "—"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Focus specialties */}
      {sprint.focus_specialties.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Foco deste Sprint</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 gap-3">
              {sprint.focus_specialties.map((focus) => (
                <div
                  key={focus.slug}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <p className="text-sm font-medium">{focus.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {focus.reason}
                    </p>
                  </div>
                  <Badge variant="secondary" className="text-xs shrink-0 ml-2">
                    {Math.round(focus.weight * 100)}%
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Goals */}
      {goals.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Metas do Sprint</CardTitle>
              <span className="text-xs text-muted-foreground">
                {completedGoals}/{goals.length} concluidas
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {goals.map((goal) => (
                <div
                  key={goal.id}
                  className="flex items-start gap-3 rounded-lg border p-3"
                >
                  {goal.is_completed ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm font-medium ${
                        goal.is_completed
                          ? "line-through text-muted-foreground"
                          : ""
                      }`}
                    >
                      {goal.title}
                    </p>
                    {goal.target_value != null && (
                      <div className="mt-1.5">
                        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                          <span>
                            {goal.current_value} / {goal.target_value}
                          </span>
                          <span>
                            {Math.min(
                              100,
                              Math.round(
                                (goal.current_value / goal.target_value) * 100,
                              ),
                            )}
                            %
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              goal.is_completed ? "bg-green-500" : "bg-primary"
                            }`}
                            style={{
                              width: `${Math.min(100, Math.round((goal.current_value / goal.target_value) * 100))}%`,
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
