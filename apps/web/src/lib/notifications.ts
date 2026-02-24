import { SupabaseClient } from "@supabase/supabase-js";

export interface AppNotification {
  id: string;
  type: "review" | "streak" | "limit" | "insight";
  title: string;
  message: string;
  href?: string;
  priority: "high" | "medium" | "low";
}

export async function getNotifications(
  supabase: SupabaseClient,
  userId: string,
): Promise<AppNotification[]> {
  const notifications: AppNotification[] = [];

  const [dueResult, streakResult, limitsResult] = await Promise.all([
    // Cards due for review
    supabase
      .from("flashcards")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("is_suspended", false)
      .lte("next_review_at", new Date().toISOString()),

    // Recent reviews (for streak check)
    supabase
      .from("reviews")
      .select("reviewed_at")
      .eq("user_id", userId)
      .gte("reviewed_at", new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString())
      .order("reviewed_at", { ascending: false })
      .limit(1),

    // Today's doubt count
    supabase
      .from("doubt_logs")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", new Date(new Date().setHours(0, 0, 0, 0)).toISOString()),
  ]);

  const dueCount = dueResult.count ?? 0;
  const lastReview = streakResult.data?.[0];
  const doubtsToday = limitsResult.count ?? 0;

  // 1. Cards due for review
  if (dueCount > 0) {
    notifications.push({
      id: "due-cards",
      type: "review",
      title: `${dueCount} ${dueCount === 1 ? "card" : "cards"} para revisar`,
      message: "Mantenha suas revisões em dia para melhor retenção.",
      href: "/review",
      priority: dueCount >= 20 ? "high" : "medium",
    });
  }

  // 2. Streak at risk
  if (lastReview) {
    const lastReviewDate = new Date(lastReview.reviewed_at);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const reviewDay = new Date(
      lastReviewDate.getFullYear(),
      lastReviewDate.getMonth(),
      lastReviewDate.getDate(),
    );

    // If last review was yesterday (not today), streak is at risk
    const diffDays = Math.floor((today.getTime() - reviewDay.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 1) {
      notifications.push({
        id: "streak-risk",
        type: "streak",
        title: "Streak em risco!",
        message: "Estude hoje para manter sua sequência.",
        href: "/review",
        priority: "high",
      });
    }
  }

  // 3. Doubt limit approaching
  if (doubtsToday >= 4) {
    notifications.push({
      id: "doubt-limit",
      type: "limit",
      title: "Limite de dúvidas quase atingido",
      message: `${doubtsToday}/5 dúvidas usadas hoje.`,
      priority: "low",
    });
  }

  // 4. No reviews today encouragement
  if (dueCount === 0 && lastReview) {
    const lastReviewDate = new Date(lastReview.reviewed_at);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const reviewDay = new Date(
      lastReviewDate.getFullYear(),
      lastReviewDate.getMonth(),
      lastReviewDate.getDate(),
    );
    const isToday = today.getTime() === reviewDay.getTime();

    if (isToday) {
      notifications.push({
        id: "all-done",
        type: "insight",
        title: "Tudo em dia!",
        message: "Parabéns, você completou todas as revisões de hoje.",
        priority: "low",
      });
    }
  }

  // Sort by priority
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  notifications.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return notifications;
}
