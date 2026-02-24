"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import type { WeekPlan, PlanEntry, Specialty } from "@/lib/planner-queries";
import { isToday } from "@/lib/planner-utils";
import { WeekNav } from "./week-nav";
import { DayColumn } from "./day-column";
import { AddBlockDialog } from "./add-block-dialog";
import { AIPlanDialog } from "./ai-plan-dialog";

interface WeeklyPlannerProps {
  initialPlan: WeekPlan;
  specialties: Specialty[];
  isPremium: boolean;
}

export function WeeklyPlanner({ initialPlan, specialties, isPremium }: WeeklyPlannerProps) {
  const router = useRouter();
  const [plan, setPlan] = useState(initialPlan);
  const [addDialogDay, setAddDialogDay] = useState<number | null>(null);
  const [showAIDialog, setShowAIDialog] = useState(false);

  // Find today's index (0-6) within this week, default to expand all on lg
  const todayIndex = plan.days.findIndex((_, i) => isToday(plan.week_start, i));
  const [expandedDay, setExpandedDay] = useState<number>(todayIndex >= 0 ? todayIndex : 0);

  const studyGoalMinutes = Math.round(plan.study_hours_goal * 60);

  // Navigation
  function handleWeekChange(newWeekStart: string) {
    router.push(`/planner?week=${newWeekStart}`);
  }

  // Add block
  const handleAddBlock = useCallback(
    async (specialtyId: string, minutes: number) => {
      if (addDialogDay === null) return;

      const supabase = createClient();
      const spec = specialties.find((s) => s.id === specialtyId);

      // Optimistic: add to local state
      const tempId = crypto.randomUUID();
      const newEntry: PlanEntry = {
        id: tempId,
        day_of_week: addDialogDay,
        specialty_id: specialtyId,
        specialty_name: spec?.name ?? "—",
        specialty_slug: spec?.slug ?? "",
        planned_minutes: minutes,
        completed_minutes: 0,
        is_completed: false,
        is_ai_generated: false,
        notes: null,
      };

      setPlan((prev) => {
        const days = [...prev.days];
        const day = { ...days[addDialogDay] };
        day.entries = [...day.entries, newEntry];
        day.total_planned += minutes;
        days[addDialogDay] = day;
        return { ...prev, days };
      });

      const { data, error } = await supabase
        .from("study_plan_entries")
        .insert({
          user_id: (await supabase.auth.getUser()).data.user!.id,
          week_start: plan.week_start,
          day_of_week: addDialogDay,
          specialty_id: specialtyId,
          planned_minutes: minutes,
        })
        .select("id")
        .single();

      if (error) {
        // Revert optimistic update
        setPlan((prev) => {
          const days = [...prev.days];
          const day = { ...days[addDialogDay] };
          day.entries = day.entries.filter((e) => e.id !== tempId);
          day.total_planned -= minutes;
          days[addDialogDay] = day;
          return { ...prev, days };
        });
        toast.error("Erro ao adicionar bloco", { description: error.message });
        return;
      }

      // Replace temp ID with real ID
      setPlan((prev) => {
        const days = [...prev.days];
        const day = { ...days[addDialogDay] };
        day.entries = day.entries.map((e) =>
          e.id === tempId ? { ...e, id: data.id } : e,
        );
        days[addDialogDay] = day;
        return { ...prev, days };
      });
    },
    [addDialogDay, plan.week_start, specialties],
  );

  // Toggle complete
  const handleToggleComplete = useCallback(
    async (entryId: string, completed: boolean) => {
      const supabase = createClient();

      // Find entry to get its planned_minutes
      let entryMinutes = 0;
      let dayIndex = -1;
      for (const day of plan.days) {
        const found = day.entries.find((e) => e.id === entryId);
        if (found) {
          entryMinutes = found.planned_minutes;
          dayIndex = day.day_of_week;
          break;
        }
      }

      // Optimistic update
      setPlan((prev) => {
        const days = prev.days.map((day) => ({
          ...day,
          entries: day.entries.map((e) =>
            e.id === entryId
              ? {
                  ...e,
                  is_completed: completed,
                  completed_minutes: completed ? e.planned_minutes : 0,
                }
              : e,
          ),
          total_completed:
            day.day_of_week === dayIndex
              ? completed
                ? day.total_completed + entryMinutes
                : day.total_completed - entryMinutes
              : day.total_completed,
        }));
        return { ...prev, days };
      });

      const { error } = await supabase
        .from("study_plan_entries")
        .update({
          is_completed: completed,
          completed_minutes: completed ? entryMinutes : 0,
        })
        .eq("id", entryId);

      if (error) {
        // Revert
        setPlan((prev) => {
          const days = prev.days.map((day) => ({
            ...day,
            entries: day.entries.map((e) =>
              e.id === entryId
                ? {
                    ...e,
                    is_completed: !completed,
                    completed_minutes: !completed ? e.planned_minutes : 0,
                  }
                : e,
            ),
            total_completed:
              day.day_of_week === dayIndex
                ? !completed
                  ? day.total_completed + entryMinutes
                  : day.total_completed - entryMinutes
                : day.total_completed,
          }));
          return { ...prev, days };
        });
        toast.error("Erro ao atualizar bloco");
      }
    },
    [plan.days],
  );

  // Delete block
  const handleDeleteBlock = useCallback(
    async (entryId: string) => {
      const supabase = createClient();

      // Save for revert
      let removedEntry: PlanEntry | null = null;
      let dayIndex = -1;
      for (const day of plan.days) {
        const found = day.entries.find((e) => e.id === entryId);
        if (found) {
          removedEntry = found;
          dayIndex = day.day_of_week;
          break;
        }
      }

      // Optimistic remove
      setPlan((prev) => {
        const days = prev.days.map((day) => {
          if (day.day_of_week !== dayIndex) return day;
          const entries = day.entries.filter((e) => e.id !== entryId);
          return {
            ...day,
            entries,
            total_planned: entries.reduce((s, e) => s + e.planned_minutes, 0),
            total_completed: entries.reduce((s, e) => s + e.completed_minutes, 0),
          };
        });
        return { ...prev, days };
      });

      const { error } = await supabase
        .from("study_plan_entries")
        .delete()
        .eq("id", entryId);

      if (error && removedEntry) {
        // Revert
        setPlan((prev) => {
          const days = [...prev.days];
          const day = { ...days[dayIndex] };
          day.entries = [...day.entries, removedEntry!];
          day.total_planned += removedEntry!.planned_minutes;
          day.total_completed += removedEntry!.completed_minutes;
          days[dayIndex] = day;
          return { ...prev, days };
        });
        toast.error("Erro ao remover bloco");
      }
    },
    [plan.days],
  );

  // After AI generates blocks, refresh the page
  function handleAIGenerated() {
    setShowAIDialog(false);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <WeekNav
        weekStart={plan.week_start}
        onWeekChange={handleWeekChange}
        isPremium={isPremium}
        onGenerateAI={() => setShowAIDialog(true)}
      />

      {/* Desktop: all 7 columns expanded */}
      <div className="hidden lg:grid lg:grid-cols-7 gap-2">
        {plan.days.map((day) => (
          <DayColumn
            key={day.day_of_week}
            day={day}
            weekStart={plan.week_start}
            studyGoalMinutes={studyGoalMinutes}
            isToday={isToday(plan.week_start, day.day_of_week)}
            expanded={true}
            onExpand={() => {}}
            onAddBlock={setAddDialogDay}
            onToggleComplete={handleToggleComplete}
            onDeleteBlock={handleDeleteBlock}
          />
        ))}
      </div>

      {/* Mobile/Tablet: today expanded, others compact */}
      <div className="lg:hidden space-y-2">
        {/* Expanded day */}
        <DayColumn
          key={`exp-${expandedDay}`}
          day={plan.days[expandedDay]}
          weekStart={plan.week_start}
          studyGoalMinutes={studyGoalMinutes}
          isToday={isToday(plan.week_start, expandedDay)}
          expanded={true}
          onExpand={() => {}}
          onAddBlock={setAddDialogDay}
          onToggleComplete={handleToggleComplete}
          onDeleteBlock={handleDeleteBlock}
        />
        {/* Other days compact */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
          {plan.days
            .filter((d) => d.day_of_week !== expandedDay)
            .map((day) => (
              <DayColumn
                key={day.day_of_week}
                day={day}
                weekStart={plan.week_start}
                studyGoalMinutes={studyGoalMinutes}
                isToday={isToday(plan.week_start, day.day_of_week)}
                expanded={false}
                onExpand={() => setExpandedDay(day.day_of_week)}
                onAddBlock={setAddDialogDay}
                onToggleComplete={handleToggleComplete}
                onDeleteBlock={handleDeleteBlock}
              />
            ))}
        </div>
      </div>

      {/* Add block dialog */}
      <AddBlockDialog
        open={addDialogDay !== null}
        onOpenChange={(open) => !open && setAddDialogDay(null)}
        dayOfWeek={addDialogDay ?? 0}
        specialties={specialties}
        onAdd={handleAddBlock}
      />

      {/* AI generation dialog */}
      {isPremium && (
        <AIPlanDialog
          open={showAIDialog}
          onOpenChange={setShowAIDialog}
          weekStart={plan.week_start}
          onGenerated={handleAIGenerated}
        />
      )}
    </div>
  );
}
