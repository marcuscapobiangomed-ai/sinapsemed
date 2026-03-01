import { SupabaseClient } from "@supabase/supabase-js";
import { getActiveSprint } from "./sprint-queries";

/**
 * Update sprint metrics after a review session or study block completion.
 * This is fire-and-forget — errors are logged but don't break the calling flow.
 */
export async function updateSprintMetrics(
  supabase: SupabaseClient,
  userId: string,
  delta: {
    study_minutes?: number;
    reviews?: number;
    simulations?: number;
  },
) {
  try {
    const sprint = await getActiveSprint(supabase, userId);
    if (!sprint || sprint.current_phase !== "active") return;

    const updates: Record<string, number> = {};
    if (delta.study_minutes) {
      updates.total_study_minutes =
        sprint.total_study_minutes + delta.study_minutes;
    }
    if (delta.reviews) {
      updates.total_reviews = sprint.total_reviews + delta.reviews;
    }
    if (delta.simulations) {
      updates.total_simulations =
        sprint.total_simulations + delta.simulations;
    }

    if (Object.keys(updates).length === 0) return;

    await supabase.from("sprints").update(updates).eq("id", sprint.id);

    // Update goal progress
    const { data: goals } = await supabase
      .from("sprint_goals")
      .select("*")
      .eq("sprint_id", sprint.id)
      .eq("is_completed", false);

    if (!goals) return;

    for (const goal of goals) {
      let newValue = goal.current_value;

      if (goal.goal_type === "reviews" && delta.reviews) {
        newValue += delta.reviews;
      } else if (goal.goal_type === "study_time" && delta.study_minutes) {
        newValue += delta.study_minutes;
      } else if (goal.goal_type === "simulations" && delta.simulations) {
        newValue += delta.simulations;
      } else {
        continue;
      }

      const isCompleted =
        goal.target_value != null && newValue >= goal.target_value;

      await supabase
        .from("sprint_goals")
        .update({
          current_value: newValue,
          is_completed: isCompleted,
          ...(isCompleted ? { completed_at: new Date().toISOString() } : {}),
        })
        .eq("id", goal.id);
    }
  } catch (err) {
    console.error("Failed to update sprint metrics:", err);
  }
}
