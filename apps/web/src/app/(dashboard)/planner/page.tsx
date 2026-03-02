import { Metadata } from "next";
import { createClient, getUser } from "@/lib/supabase/server";
import { getWeekPlan, getSpecialties } from "@/lib/planner-queries";
import { getMondayOfWeek } from "@/lib/planner-utils";
import { WeeklyPlanner } from "./weekly-planner";

export const metadata: Metadata = {
  title: "Planner",
};

export default async function PlannerPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const { week } = await searchParams;
  const supabase = await createClient();
  const user = await getUser();
  const userId = user!.id;

  const weekStart = week ?? getMondayOfWeek();

  const EMPTY_WEEK: import("@/lib/planner-queries").WeekPlan = {
    week_start: weekStart,
    study_hours_goal: 4,
    days: Array.from({ length: 7 }, (_, i) => ({ day_of_week: i, entries: [], total_planned: 0, total_completed: 0, due_cards: 0 })),
  };

  const [weekPlan, specialties, subscriptionResult] = await Promise.all([
    getWeekPlan(supabase, userId, weekStart).catch(() => EMPTY_WEEK),
    getSpecialties(supabase).catch(() => []),
    supabase
      .from("subscriptions")
      .select("plans(has_priority_ai)")
      .eq("user_id", userId)
      .eq("status", "active")
      .maybeSingle(),
  ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const planData = subscriptionResult.data?.plans as any;
  const isPremium = planData?.has_priority_ai === true;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Planner Semanal</h1>
        <p className="text-muted-foreground">
          Organize seus estudos da semana
        </p>
      </div>
      <WeeklyPlanner
        initialPlan={weekPlan}
        specialties={specialties}
        isPremium={isPremium}
      />
    </div>
  );
}
