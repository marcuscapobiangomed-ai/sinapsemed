import type { PlanEntry } from "@/lib/planner-queries";
import type { Sprint, SprintGoal } from "@/lib/sprint-queries";
import { formatMinutes } from "@/lib/planner-utils";

export interface DueBySpecialty {
  specialty_name: string;
  specialty_slug: string;
  count: number;
}

export type MissionPriority = "planejado" | "meta";

export interface Mission {
  id: string;
  type: "planner_block" | "sprint_goal";
  priority: MissionPriority;
  title: string;
  subtitle: string;
  estimatedMinutes: number | null;
  isCompleted: boolean;
  specialtySlug: string | null;
  planEntryId: string | null;
  targetValue: number | null;
  currentValue: number | null;
  actionHref: string | null;
  actionLabel: string | null;
}

export function buildPlannerMissions(entries: PlanEntry[]): Mission[] {
  const missions: Mission[] = entries.map((entry) => ({
    id: `plan-${entry.id}`,
    type: "planner_block" as const,
    priority: "planejado" as const,
    title: entry.specialty_name,
    subtitle: entry.notes
      ? `${formatMinutes(entry.planned_minutes)} · ${entry.notes}`
      : formatMinutes(entry.planned_minutes),
    estimatedMinutes: entry.planned_minutes,
    isCompleted: entry.is_completed,
    specialtySlug: entry.specialty_slug,
    planEntryId: entry.id,
    targetValue: null,
    currentValue: null,
    actionHref: null,
    actionLabel: null,
  }));

  missions.sort((a, b) => {
    if (a.isCompleted !== b.isCompleted) return a.isCompleted ? 1 : -1;
    return 0;
  });

  return missions;
}

export function buildSprintMissions(
  sprintGoals: SprintGoal[],
  activeSprint: Sprint | null,
): Mission[] {
  if (!activeSprint) return [];

  return sprintGoals
    .filter((g) => !g.is_completed)
    .slice(0, 3)
    .map((goal) => ({
      id: `goal-${goal.id}`,
      type: "sprint_goal" as const,
      priority: "meta" as const,
      title: goal.title,
      subtitle:
        goal.target_value != null
          ? `${goal.current_value}/${goal.target_value}`
          : "Meta do Sprint",
      estimatedMinutes: null,
      isCompleted: false,
      specialtySlug: goal.specialty_slug,
      planEntryId: null,
      targetValue: goal.target_value,
      currentValue: goal.current_value,
      actionHref: "/sprints",
      actionLabel: "Ver Sprint",
    }));
}
