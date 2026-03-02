import type { PlanEntry } from "@/lib/planner-queries";
import type { DueBySpecialty } from "./mission-logic";

export type PageMode =
  | { mode: "review"; dueCount: number; topSpecialties: DueBySpecialty[] }
  | { mode: "planner"; pendingEntries: PlanEntry[]; dueCount: number }
  | {
      mode: "done";
      reviewsToday: number;
      streak: number;
      totalCompleted: number;
    };

export function computePageMode(input: {
  dueCount: number;
  entries: PlanEntry[];
  totalCompleted: number;
  studyGoalMinutes: number;
  reviewsToday: number;
  streak: number;
  dueBySpecialty: DueBySpecialty[];
}): PageMode {
  const pendingEntries = input.entries.filter((e) => !e.is_completed);

  const allDone =
    input.dueCount === 0 &&
    pendingEntries.length === 0 &&
    input.totalCompleted >= input.studyGoalMinutes &&
    input.studyGoalMinutes > 0;

  if (allDone) {
    return {
      mode: "done",
      reviewsToday: input.reviewsToday,
      streak: input.streak,
      totalCompleted: input.totalCompleted,
    };
  }

  if (input.dueCount >= 10) {
    return {
      mode: "review",
      dueCount: input.dueCount,
      topSpecialties: input.dueBySpecialty.slice(0, 3),
    };
  }

  return {
    mode: "planner",
    pendingEntries,
    dueCount: input.dueCount,
  };
}
