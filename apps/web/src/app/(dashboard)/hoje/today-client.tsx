"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import type { PlanEntry } from "@/lib/planner-queries";
import type { GapAnalysisData } from "@/lib/gap-queries";
import type { Sprint, SprintGoal } from "@/lib/sprint-queries";
import type { DueBySpecialty } from "./mission-logic";
import { computeBriefing } from "./briefing-logic";
import { buildMissions } from "./mission-logic";
import { computeInsights } from "./insights-logic";
import { DailyBriefing } from "./daily-briefing";
import { ProgressRing } from "./progress-ring";
import { MissionList } from "./mission-list";
import { SmartInsights } from "./smart-insights";
import { QuickActions } from "./quick-actions";
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

  const missions = buildMissions({
    entries,
    dueBySpecialty,
    sprintGoals,
    activeSprint,
  });

  const insights = computeInsights({
    gapAnalysis,
    dueBySpecialty,
    activeSprint,
    sprintGoals,
    streak,
  });

  return (
    <div className="space-y-6">
      <DailyBriefing briefing={briefing} streak={streak} />

      <ProgressRing
        totalCompleted={totalCompleted}
        studyGoalMinutes={studyGoalMinutes}
        streak={streak}
        dueCount={dueCount}
        reviewsToday={reviewsToday}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <MissionList missions={missions} onToggleEntry={handleToggle} />
        </div>

        <div className="space-y-6">
          <SmartInsights insights={insights} />
          <QuickActions
            dueCount={dueCount}
            onClinicalTrigger={() => setClinicalDialogOpen(true)}
          />
        </div>
      </div>

      <ClinicalTriggerDialog
        open={clinicalDialogOpen}
        onOpenChange={setClinicalDialogOpen}
      />
    </div>
  );
}
