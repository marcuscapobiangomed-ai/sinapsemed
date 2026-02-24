import { SupabaseClient } from "@supabase/supabase-js";

// ── Types ──

export interface PlanLimits {
  plan_slug: string;
  plan_name: string;
  max_flashcards_per_month: number | null; // null = unlimited
  max_doubts_per_day: number | null;
  max_bancas: number | null;
  max_simulations_per_month: number | null;
}

export interface UsageCount {
  flashcards_this_month: number;
  doubts_today: number;
  simulations_this_month: number;
  bancas_count: number;
}

export interface LimitCheck {
  allowed: boolean;
  current: number;
  limit: number | null; // null = unlimited
  plan_name: string;
}

// ── Free plan defaults (fallback when no subscription) ──

const FREE_LIMITS: PlanLimits = {
  plan_slug: "free",
  plan_name: "Gratuito",
  max_flashcards_per_month: 30,
  max_doubts_per_day: 5,
  max_bancas: 1,
  max_simulations_per_month: 1,
};

// ── Queries ──

export async function getPlanLimits(
  supabase: SupabaseClient,
  userId: string,
): Promise<PlanLimits> {
  const { data: sub } = await supabase
    .from("subscriptions")
    .select(
      "plans(slug, name, max_flashcards_per_month, max_doubts_per_day, max_bancas, max_simulations_per_month)",
    )
    .eq("user_id", userId)
    .eq("status", "active")
    .maybeSingle();

  if (!sub) return FREE_LIMITS;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const plan = (sub as any).plans;
  if (!plan) return FREE_LIMITS;

  return {
    plan_slug: plan.slug,
    plan_name: plan.name,
    max_flashcards_per_month: plan.max_flashcards_per_month,
    max_doubts_per_day: plan.max_doubts_per_day,
    max_bancas: plan.max_bancas,
    max_simulations_per_month: plan.max_simulations_per_month,
  };
}

export async function getUsageCount(
  supabase: SupabaseClient,
  userId: string,
): Promise<UsageCount> {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

  const [flashcardsResult, doubtsResult, simulationsResult, bancasResult] =
    await Promise.all([
      supabase
        .from("flashcards")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .gte("created_at", monthStart),

      supabase
        .from("doubt_logs")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .gte("created_at", todayStart),

      supabase
        .from("simulations")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .gte("created_at", monthStart),

      supabase
        .from("user_bancas")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId),
    ]);

  return {
    flashcards_this_month: flashcardsResult.count ?? 0,
    doubts_today: doubtsResult.count ?? 0,
    simulations_this_month: simulationsResult.count ?? 0,
    bancas_count: bancasResult.count ?? 0,
  };
}

// ── Limit checks ──

export function checkFlashcardLimit(limits: PlanLimits, usage: UsageCount): LimitCheck {
  return {
    allowed: limits.max_flashcards_per_month === null || usage.flashcards_this_month < limits.max_flashcards_per_month,
    current: usage.flashcards_this_month,
    limit: limits.max_flashcards_per_month,
    plan_name: limits.plan_name,
  };
}

export function checkDoubtLimit(limits: PlanLimits, usage: UsageCount): LimitCheck {
  return {
    allowed: limits.max_doubts_per_day === null || usage.doubts_today < limits.max_doubts_per_day,
    current: usage.doubts_today,
    limit: limits.max_doubts_per_day,
    plan_name: limits.plan_name,
  };
}

export function checkSimulationLimit(limits: PlanLimits, usage: UsageCount): LimitCheck {
  return {
    allowed: limits.max_simulations_per_month === null || usage.simulations_this_month < limits.max_simulations_per_month,
    current: usage.simulations_this_month,
    limit: limits.max_simulations_per_month,
    plan_name: limits.plan_name,
  };
}

export function checkBancaLimit(limits: PlanLimits, usage: UsageCount): LimitCheck {
  return {
    allowed: limits.max_bancas === null || usage.bancas_count < limits.max_bancas,
    current: usage.bancas_count,
    limit: limits.max_bancas,
    plan_name: limits.plan_name,
  };
}
