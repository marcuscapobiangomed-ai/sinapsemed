import { SupabaseClient } from "@supabase/supabase-js";

// ── Types ──

export interface AccuracyDataPoint {
  date: string; // YYYY-MM-DD
  accuracy: number; // 0-100
  total: number;
  correct: number;
}

export interface HeatmapDataPoint {
  date: string; // YYYY-MM-DD
  count: number;
}

export interface CardStateData {
  state: number; // 0=New, 1=Learning, 2=Review, 3=Relearning
  label: string;
  count: number;
}

export interface DeckPerformanceData {
  deckId: string;
  title: string;
  color: string;
  accuracy: number;
  totalReviews: number;
}

// ── Helpers ──

function daysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

function toDateString(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toISOString().slice(0, 10);
}

// ── Queries ──

/**
 * Calculate study streak (consecutive days with at least 1 review, ending today)
 */
export async function getStreak(
  supabase: SupabaseClient,
  userId: string,
): Promise<number> {
  const { data: reviews } = await supabase
    .from("reviews")
    .select("reviewed_at")
    .eq("user_id", userId)
    .gte("reviewed_at", daysAgo(365))
    .order("reviewed_at", { ascending: false });

  if (!reviews || reviews.length === 0) return 0;

  // Get unique dates
  const dates = new Set(
    reviews.map((r) => toDateString(r.reviewed_at)),
  );

  // Count consecutive days from today backwards
  let streak = 0;
  const today = new Date();

  for (let i = 0; i < 365; i++) {
    const checkDate = new Date(today);
    checkDate.setDate(today.getDate() - i);
    const dateStr = toDateString(checkDate);

    if (dates.has(dateStr)) {
      streak++;
    } else if (i === 0) {
      // Today doesn't have reviews yet — check from yesterday
      continue;
    } else {
      break;
    }
  }

  return streak;
}

/**
 * Accuracy % over time (last 30 days)
 */
export async function getAccuracyOverTime(
  supabase: SupabaseClient,
  userId: string,
): Promise<AccuracyDataPoint[]> {
  const { data: reviews } = await supabase
    .from("reviews")
    .select("reviewed_at, rating")
    .eq("user_id", userId)
    .gte("reviewed_at", daysAgo(30))
    .order("reviewed_at", { ascending: true });

  if (!reviews || reviews.length === 0) return [];

  // Group by date
  const byDate = new Map<
    string,
    { total: number; correct: number }
  >();

  for (const r of reviews) {
    const date = toDateString(r.reviewed_at);
    const entry = byDate.get(date) ?? { total: 0, correct: 0 };
    entry.total++;
    if (r.rating === "good" || r.rating === "easy") {
      entry.correct++;
    }
    byDate.set(date, entry);
  }

  return Array.from(byDate.entries()).map(([date, { total, correct }]) => ({
    date,
    accuracy: Math.round((correct / total) * 100),
    total,
    correct,
  }));
}

/**
 * Heatmap data (last 180 days, count of reviews per day)
 */
export async function getHeatmapData(
  supabase: SupabaseClient,
  userId: string,
): Promise<HeatmapDataPoint[]> {
  const { data: reviews } = await supabase
    .from("reviews")
    .select("reviewed_at")
    .eq("user_id", userId)
    .gte("reviewed_at", daysAgo(180));

  if (!reviews || reviews.length === 0) return [];

  const byDate = new Map<string, number>();

  for (const r of reviews) {
    const date = toDateString(r.reviewed_at);
    byDate.set(date, (byDate.get(date) ?? 0) + 1);
  }

  return Array.from(byDate.entries()).map(([date, count]) => ({
    date,
    count,
  }));
}

/**
 * Card state distribution (New/Learning/Review/Relearning)
 */
export async function getCardStateDistribution(
  supabase: SupabaseClient,
  userId: string,
): Promise<CardStateData[]> {
  const { data: flashcards } = await supabase
    .from("flashcards")
    .select("fsrs_state")
    .eq("user_id", userId)
    .eq("is_suspended", false);

  if (!flashcards || flashcards.length === 0) return [];

  const labels: Record<number, string> = {
    0: "Novo",
    1: "Aprendendo",
    2: "Revisão",
    3: "Reaprendendo",
  };

  const counts = new Map<number, number>();
  for (const f of flashcards) {
    const state = f.fsrs_state ?? 0;
    counts.set(state, (counts.get(state) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([state, count]) => ({
      state,
      label: labels[state] ?? `Estado ${state}`,
      count,
    }))
    .sort((a, b) => a.state - b.state);
}

/**
 * Performance by deck (accuracy %)
 */
export async function getDeckPerformance(
  supabase: SupabaseClient,
  userId: string,
): Promise<DeckPerformanceData[]> {
  // Fetch decks
  const { data: decks } = await supabase
    .from("decks")
    .select("id, title, color")
    .eq("user_id", userId)
    .eq("is_archived", false);

  if (!decks || decks.length === 0) return [];

  // Fetch all reviews with their flashcard's deck_id
  const { data: reviews } = await supabase
    .from("reviews")
    .select("rating, flashcard_id, flashcards!inner(deck_id)")
    .eq("user_id", userId);

  if (!reviews || reviews.length === 0) return [];

  // Aggregate by deck
  const deckStats = new Map<
    string,
    { total: number; correct: number }
  >();

  for (const r of reviews) {
    const deckId = (r.flashcards as unknown as { deck_id: string })?.deck_id;
    if (!deckId) continue;

    const entry = deckStats.get(deckId) ?? { total: 0, correct: 0 };
    entry.total++;
    if (r.rating === "good" || r.rating === "easy") {
      entry.correct++;
    }
    deckStats.set(deckId, entry);
  }

  // Map to deck info
  const deckMap = new Map(decks.map((d) => [d.id, d]));

  return Array.from(deckStats.entries())
    .map(([deckId, { total, correct }]) => {
      const deck = deckMap.get(deckId);
      if (!deck) return null;
      return {
        deckId,
        title: deck.title,
        color: deck.color ?? "#3b82f6",
        accuracy: Math.round((correct / total) * 100),
        totalReviews: total,
      };
    })
    .filter((d): d is DeckPerformanceData => d !== null)
    .sort((a, b) => b.accuracy - a.accuracy);
}
