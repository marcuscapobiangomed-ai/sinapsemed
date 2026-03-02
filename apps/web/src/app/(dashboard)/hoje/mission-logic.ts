import type { PlanEntry } from "@/lib/planner-queries";
import type { Sprint, SprintGoal } from "@/lib/sprint-queries";
import { formatMinutes } from "@/lib/planner-utils";

export interface DueBySpecialty {
  specialty_name: string;
  specialty_slug: string;
  count: number;
}

export type MissionPriority = "urgente" | "planejado" | "meta";

export interface Mission {
  id: string;
  type: "overdue_review" | "planner_block" | "sprint_goal";
  priority: MissionPriority;
  title: string;
  subtitle: string;
  estimatedMinutes: number | null;
  isCompleted: boolean;
  actionHref: string;
  actionLabel: string;
  specialtySlug: string | null;
  planEntryId: string | null;
  targetValue: number | null;
  currentValue: number | null;
}

export function buildMissions(input: {
  entries: PlanEntry[];
  dueBySpecialty: DueBySpecialty[];
  sprintGoals: SprintGoal[];
  activeSprint: Sprint | null;
}): Mission[] {
  const missions: Mission[] = [];

  // TIER 1: Overdue card reviews (>= 5 per specialty)
  const significantDue = input.dueBySpecialty
    .filter((d) => d.count >= 5)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  for (const due of significantDue) {
    missions.push({
      id: `overdue-${due.specialty_slug}`,
      type: "overdue_review",
      priority: "urgente",
      title: `Revisar ${due.specialty_name}`,
      subtitle: `${due.count} cards vencidos`,
      estimatedMinutes: Math.min(due.count * 2, 30),
      isCompleted: false,
      actionHref: `/review?specialty=${due.specialty_slug}`,
      actionLabel: "Revisar",
      specialtySlug: due.specialty_slug,
      planEntryId: null,
      targetValue: null,
      currentValue: null,
    });
  }

  // Fallback: single "review all" mission if no specialty has >= 5
  if (significantDue.length === 0 && input.dueBySpecialty.length > 0) {
    const totalDue = input.dueBySpecialty.reduce((s, d) => s + d.count, 0);
    if (totalDue > 0) {
      missions.push({
        id: "overdue-all",
        type: "overdue_review",
        priority: "urgente",
        title: "Revisar flashcards pendentes",
        subtitle: `${totalDue} cards vencidos`,
        estimatedMinutes: Math.min(totalDue * 2, 30),
        isCompleted: false,
        actionHref: "/review",
        actionLabel: "Revisar",
        specialtySlug: null,
        planEntryId: null,
        targetValue: null,
        currentValue: null,
      });
    }
  }

  // TIER 2: Today's planner blocks
  for (const entry of input.entries) {
    missions.push({
      id: `plan-${entry.id}`,
      type: "planner_block",
      priority: "planejado",
      title: entry.specialty_name,
      subtitle: entry.notes
        ? `${formatMinutes(entry.planned_minutes)} · ${entry.notes}`
        : formatMinutes(entry.planned_minutes),
      estimatedMinutes: entry.planned_minutes,
      isCompleted: entry.is_completed,
      actionHref: `/review?specialty=${entry.specialty_slug}`,
      actionLabel: "Estudar",
      specialtySlug: entry.specialty_slug,
      planEntryId: entry.id,
      targetValue: null,
      currentValue: null,
    });
  }

  // TIER 3: Sprint goals (incomplete only)
  if (input.activeSprint) {
    const incompleteGoals = input.sprintGoals.filter((g) => !g.is_completed);
    for (const goal of incompleteGoals.slice(0, 3)) {
      missions.push({
        id: `goal-${goal.id}`,
        type: "sprint_goal",
        priority: "meta",
        title: goal.title,
        subtitle:
          goal.target_value != null
            ? `${goal.current_value}/${goal.target_value}`
            : "Meta do Sprint",
        estimatedMinutes: null,
        isCompleted: false,
        actionHref: "/sprints",
        actionLabel: "Ver Sprint",
        specialtySlug: goal.specialty_slug,
        planEntryId: null,
        targetValue: goal.target_value,
        currentValue: goal.current_value,
      });
    }
  }

  // Sort: urgente → planejado (incomplete first) → meta
  const priorityOrder = { urgente: 0, planejado: 1, meta: 2 };
  missions.sort((a, b) => {
    const pDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (pDiff !== 0) return pDiff;
    if (a.isCompleted !== b.isCompleted) return a.isCompleted ? 1 : -1;
    return 0;
  });

  return missions;
}
