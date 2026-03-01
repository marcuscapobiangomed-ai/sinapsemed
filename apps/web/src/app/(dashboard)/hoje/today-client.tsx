"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  BookOpen,
  Flame,
  Zap,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Stethoscope,
} from "lucide-react";
import { getSpecialtyColor, formatMinutes } from "@/lib/planner-utils";
import type { PlanEntry } from "@/lib/planner-queries";
import type { SpecialtyGap } from "@/lib/gap-queries";
import { ClinicalTriggerDialog } from "./clinical-trigger-dialog";

interface TodayClientProps {
  entries: PlanEntry[];
  todayTotalPlanned: number;
  todayTotalCompleted: number;
  dueCount: number;
  reviewsToday: number;
  streak: number;
  topGaps: SpecialtyGap[];
  studyGoalMinutes: number;
}

export function TodayClient({
  entries: initialEntries,
  todayTotalPlanned,
  todayTotalCompleted: initialCompleted,
  dueCount,
  reviewsToday,
  streak,
  topGaps,
  studyGoalMinutes,
}: TodayClientProps) {
  const router = useRouter();
  const [entries, setEntries] = useState(initialEntries);
  const [totalCompleted, setTotalCompleted] = useState(initialCompleted);
  const [clinicalDialogOpen, setClinicalDialogOpen] = useState(false);

  async function handleToggle(entryId: string, completed: boolean) {
    const entry = entries.find((e) => e.id === entryId);
    if (!entry) return;

    const minutes = entry.planned_minutes;

    // Optimistic update
    setEntries((prev) =>
      prev.map((e) =>
        e.id === entryId
          ? {
              ...e,
              is_completed: completed,
              completed_minutes: completed ? e.planned_minutes : 0,
            }
          : e,
      ),
    );
    setTotalCompleted((prev) =>
      completed ? prev + minutes : prev - minutes,
    );

    const supabase = createClient();
    const { error } = await supabase
      .from("study_plan_entries")
      .update({
        is_completed: completed,
        completed_minutes: completed ? minutes : 0,
      })
      .eq("id", entryId);

    if (error) {
      // Revert
      setEntries((prev) =>
        prev.map((e) =>
          e.id === entryId
            ? {
                ...e,
                is_completed: !completed,
                completed_minutes: !completed ? e.planned_minutes : 0,
              }
            : e,
        ),
      );
      setTotalCompleted((prev) =>
        !completed ? prev + minutes : prev - minutes,
      );
      toast.error("Erro ao atualizar bloco");
      return;
    }

    // Feature 3: toast com link para revisão ao completar
    if (completed && entry.specialty_slug) {
      toast.success(`${entry.specialty_name} concluído!`, {
        description: "Revisar flashcards desta especialidade?",
        action: {
          label: "Revisar",
          onClick: () =>
            router.push(`/review?specialty=${entry.specialty_slug}`),
        },
        duration: 8000,
      });
    }
  }

  const progressPercent =
    studyGoalMinutes > 0
      ? Math.min(100, Math.round((totalCompleted / studyGoalMinutes) * 100))
      : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Hoje</h1>
        <p className="text-muted-foreground">
          Sua missão do dia
        </p>
      </div>

      {/* Section A: Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Link href="/review" className="block">
          <Card className="hover:border-primary/50 transition-colors cursor-pointer">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <BookOpen className="h-4 w-4" />
                <span className="text-xs font-medium">Para revisar</span>
              </div>
              <p className="text-2xl font-bold">{dueCount}</p>
            </CardContent>
          </Card>
        </Link>

        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Flame className="h-4 w-4 text-orange-500" />
              <span className="text-xs font-medium">Streak</span>
            </div>
            <p className="text-2xl font-bold">
              {streak} <span className="text-sm font-normal text-muted-foreground">dias</span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Clock className="h-4 w-4" />
              <span className="text-xs font-medium">Estudado</span>
            </div>
            <p className="text-2xl font-bold">
              {formatMinutes(totalCompleted)}
              <span className="text-sm font-normal text-muted-foreground">
                {" "}
                / {formatMinutes(studyGoalMinutes)}
              </span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span className="text-xs font-medium">Revisões hoje</span>
            </div>
            <p className="text-2xl font-bold">{reviewsToday}</p>
          </CardContent>
        </Card>
      </div>

      {/* Progress bar */}
      {todayTotalPlanned > 0 && (
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Progresso do dia</span>
            <span>{progressPercent}%</span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Section B: Blocos de hoje */}
        <div className="lg:col-span-2 space-y-3">
          <h2 className="text-lg font-semibold">Blocos de estudo</h2>
          {entries.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                <Clock className="h-10 w-10 text-muted-foreground/50 mb-3" />
                <p className="text-sm font-medium">Nenhum bloco para hoje</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Adicione blocos no Planner ou use a geração por IA
                </p>
                <Button asChild variant="outline" size="sm" className="mt-3">
                  <Link href="/planner">Ir para Planner</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {entries.map((entry) => (
                <Card
                  key={entry.id}
                  className={entry.is_completed ? "opacity-60" : ""}
                >
                  <CardContent className="flex items-center gap-3 py-3">
                    <Checkbox
                      checked={entry.is_completed}
                      onCheckedChange={(checked: boolean) =>
                        handleToggle(entry.id, checked)
                      }
                    />
                    <div
                      className="w-1 h-8 rounded-full shrink-0"
                      style={{
                        backgroundColor: getSpecialtyColor(
                          entry.specialty_slug,
                        ),
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm font-medium ${entry.is_completed ? "line-through" : ""}`}
                      >
                        {entry.specialty_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatMinutes(entry.planned_minutes)}
                        {entry.notes && ` · ${entry.notes}`}
                      </p>
                    </div>
                    {entry.is_ai_generated && (
                      <Badge variant="secondary" className="text-[10px] px-1.5">
                        IA
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Section C + D: Sidebar */}
        <div className="space-y-6">
          {/* Lacunas */}
          {topGaps.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold">Prioridades</h2>
              <div className="space-y-2">
                {topGaps.map((gap) => (
                  <Link
                    key={gap.specialty_slug}
                    href={`/review?specialty=${gap.specialty_slug}`}
                    className="block"
                  >
                    <Card className="hover:border-primary/50 transition-colors">
                      <CardContent className="flex items-center gap-3 py-3">
                        <div
                          className="w-1 h-8 rounded-full shrink-0"
                          style={{
                            backgroundColor: getSpecialtyColor(
                              gap.specialty_slug,
                            ),
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {gap.specialty_name}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {gap.combined_accuracy < 50 && (
                              <AlertTriangle className="h-3 w-3 text-destructive" />
                            )}
                            <span className="text-xs text-muted-foreground">
                              {gap.combined_accuracy}% acerto
                            </span>
                            {gap.data_confidence === "low" && (
                              <Badge
                                variant="outline"
                                className="text-[10px] px-1"
                              >
                                poucos dados
                              </Badge>
                            )}
                          </div>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Ações rápidas */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Ações rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button asChild variant="outline" className="w-full justify-start gap-2">
                <Link href="/review?mode=quick">
                  <Zap className="h-4 w-4" />
                  Revisão Rápida (~5 min)
                </Link>
              </Button>
              {dueCount > 0 && (
                <Button asChild className="w-full justify-start gap-2">
                  <Link href="/review">
                    <BookOpen className="h-4 w-4" />
                    Revisar {dueCount} cards
                  </Link>
                </Button>
              )}
              <Button
                variant="outline"
                className="w-full justify-start gap-2"
                onClick={() => setClinicalDialogOpen(true)}
              >
                <Stethoscope className="h-4 w-4" />
                Vi no Plantão
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <ClinicalTriggerDialog
        open={clinicalDialogOpen}
        onOpenChange={setClinicalDialogOpen}
      />
    </div>
  );
}
