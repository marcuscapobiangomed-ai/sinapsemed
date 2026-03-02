"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Stethoscope } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { PlanEntry } from "@/lib/planner-queries";
import type { GapAnalysisData } from "@/lib/gap-queries";
import type { Sprint, SprintGoal } from "@/lib/sprint-queries";
import type { DueBySpecialty } from "./mission-logic";
import { computeBriefing } from "./briefing-logic";
import { buildPlannerMissions, buildSprintMissions } from "./mission-logic";
import { computeInsights } from "./insights-logic";
import { computePageMode } from "./page-mode";
import { StatusBar } from "./status-bar";
import { PrimaryAction } from "./primary-action";
import { SmartInsights } from "./smart-insights";
import { MissionItem } from "./mission-item";
import { ClinicalTriggerDialog } from "./clinical-trigger-dialog";

interface TodayClientProps {
  firstName: string;
  entries: PlanEntry[];
  todayTotalPlanned: number;
  todayTotalCompleted: number;
  dueCount: number;
  reviewsToday: number;
  streak: number;
  gapAnalysis: GapAnalysisData;
  dueBySpecialty: DueBySpecialty[];
  sprintGoals: SprintGoal[];
  studyGoalMinutes: number;
  activeSprint: Sprint | null;
}

export function TodayClient({
  firstName,
  entries: initialEntries,
  todayTotalCompleted: initialCompleted,
  dueCount,
  reviewsToday,
  streak,
  gapAnalysis,
  dueBySpecialty,
  sprintGoals,
  studyGoalMinutes,
  activeSprint,
}: TodayClientProps) {
  const router = useRouter();
  const [entries, setEntries] = useState(initialEntries);
  const [totalCompleted, setTotalCompleted] = useState(initialCompleted);
  const [clinicalDialogOpen, setClinicalDialogOpen] = useState(false);

  async function handleToggle(entryId: string, completed: boolean) {
    const entry = entries.find((e) => e.id === entryId);
    if (!entry) return;

    const minutes = entry.planned_minutes;

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

  const briefing = computeBriefing({
    firstName,
    streak,
    dueCount,
    reviewsToday,
    totalCompleted,
    studyGoalMinutes,
    gapAnalysis,
    activeSprint,
    sprintGoals,
    entries,
  });

  const pageMode = computePageMode({
    dueCount,
    entries,
    totalCompleted,
    studyGoalMinutes,
    reviewsToday,
    streak,
    dueBySpecialty,
  });

  const plannerMissions = buildPlannerMissions(entries);
  const sprintMissions = buildSprintMissions(sprintGoals, activeSprint);

  const insights = computeInsights({
    gapAnalysis,
    dueBySpecialty,
    activeSprint,
    sprintGoals,
    streak,
  });

  return (
    <div className="space-y-5">
      {/* ZONE 1: Status Bar */}
      <StatusBar
        greeting={briefing.greeting}
        streak={streak}
        reviewsToday={reviewsToday}
        totalCompleted={totalCompleted}
        studyGoalMinutes={studyGoalMinutes}
      />

      {/* ZONE 2 + ZONE 3 */}
      <div className="grid gap-5 lg:grid-cols-5">
        {/* ZONE 2: Primary Action */}
        <div className="lg:col-span-3">
          <PrimaryAction
            pageMode={pageMode}
            briefing={briefing}
            plannerMissions={plannerMissions}
            onToggleEntry={handleToggle}
            onClinicalTrigger={() => setClinicalDialogOpen(true)}
          />
        </div>

        {/* ZONE 3: Secondary Info */}
        <div className="space-y-4 lg:col-span-2 lg:sticky lg:top-5 lg:self-start">
          {/* Sprint goals */}
          {sprintMissions.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Sprint
              </h3>
              <div className="divide-y rounded-lg border">
                {sprintMissions.map((mission) => (
                  <MissionItem key={mission.id} mission={mission} />
                ))}
              </div>
            </div>
          )}

          {/* Insights */}
          <SmartInsights insights={insights} />

          {/* Clinical Trigger */}
          {pageMode.mode !== "done" && (
            <button
              onClick={() => setClinicalDialogOpen(true)}
              className="flex items-center gap-3 w-full rounded-lg border border-dashed p-3 text-left hover:bg-muted/50 transition-colors"
            >
              <Stethoscope className="h-4 w-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-sm font-medium">Vi no Plantão</p>
                <p className="text-xs text-muted-foreground">
                  Criar flashcards a partir de um caso clínico
                </p>
              </div>
            </button>
          )}
        </div>
      </div>

      <ClinicalTriggerDialog
        open={clinicalDialogOpen}
        onOpenChange={setClinicalDialogOpen}
      />
    </div>
  );
}
