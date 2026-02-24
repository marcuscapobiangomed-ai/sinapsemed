import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
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
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = user!.id;

  const weekStart = week ?? getMondayOfWeek();

  const [weekPlan, specialties, subscriptionResult] = await Promise.all([
    getWeekPlan(supabase, userId, weekStart),
    getSpecialties(supabase),
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
