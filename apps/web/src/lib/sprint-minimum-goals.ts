import { SupabaseClient } from "@supabase/supabase-js";
import type { Sprint } from "./sprint-queries";

export interface MinimumReviewCard {
  flashcard_id: string;
  specialty_slug: string;
  stability: number;
}

/**
 * Get the minimum set of cards to review when the user has limited time.
 * Selects the ~20% most urgent cards, prioritizing sprint focus specialties.
 */
export async function getMinimumReviewCards(
  supabase: SupabaseClient,
  userId: string,
  sprint: Sprint,
  maxCards: number = 10,
): Promise<MinimumReviewCard[]> {
  const focusSlugs = sprint.focus_specialties.map((f) => f.slug);

  // Get due cards with stability info
  const { data: dueCards } = await supabase
    .from("flashcards")
    .select("id, specialty_id, fsrs_stability, specialties(slug)")
    .eq("user_id", userId)
    .eq("is_suspended", false)
    .or(
      `next_review_at.is.null,next_review_at.lte.${new Date().toISOString()}`,
    )
    .order("fsrs_stability", { ascending: true, nullsFirst: true })
    .limit(100);

  if (!dueCards || dueCards.length === 0) return [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cards = (dueCards as any[]).map((c) => ({
    flashcard_id: c.id as string,
    specialty_slug: c.specialties?.slug as string,
    stability: (c.fsrs_stability ?? 0) as number,
  }));

  // Priority: focus specialties first, then by lowest stability
  const focusCards = cards.filter((c) => focusSlugs.includes(c.specialty_slug));
  const otherCards = cards.filter(
    (c) => !focusSlugs.includes(c.specialty_slug),
  );

  return [...focusCards, ...otherCards].slice(0, maxCards);
}
