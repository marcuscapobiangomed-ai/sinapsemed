import { SupabaseClient } from "@supabase/supabase-js";

export interface PrioritizedCard {
  flashcard_id: string;
  specialty_slug: string;
  specialty_name: string;
  stability: number;
  banca_weight: number;
  priority_score: number;
}

/**
 * Get the top 20% of content prioritized by banca weight and weakness.
 * Used in Sprint 80/20 (Reta Final) mode.
 *
 * Strategy:
 * 1. Get specialty weights from primary banca
 * 2. Get all due flashcards with stability scores
 * 3. Score = banca_weight * (1 / (stability + 0.1))
 * 4. Return top 20% by score
 */
export async function get8020Queue(
  supabase: SupabaseClient,
  userId: string,
): Promise<PrioritizedCard[]> {
  // Get primary banca weights
  const { data: userBanca } = await supabase
    .from("user_bancas")
    .select("bancas(specialty_weights)")
    .eq("user_id", userId)
    .eq("is_primary", true)
    .maybeSingle();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bancaData = userBanca?.bancas as any;
  const weights: Record<string, number> = bancaData?.specialty_weights ?? {};

  // Get all due cards
  const { data: cards } = await supabase
    .from("flashcards")
    .select("id, fsrs_stability, specialty_id, specialties(slug, name)")
    .eq("user_id", userId)
    .eq("is_suspended", false)
    .or(
      `next_review_at.is.null,next_review_at.lte.${new Date().toISOString()}`,
    )
    .order("fsrs_stability", { ascending: true, nullsFirst: true });

  if (!cards || cards.length === 0) return [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const scored = (cards as any[]).map((c) => {
    const slug = c.specialties?.slug ?? "";
    const name = c.specialties?.name ?? "";
    const stability = (c.fsrs_stability ?? 0) as number;
    const bancaWeight = weights[slug] ?? 0.05; // default small weight

    // Higher score = more important to review
    const priorityScore = bancaWeight * (1 / (stability + 0.1));

    return {
      flashcard_id: c.id as string,
      specialty_slug: slug,
      specialty_name: name,
      stability,
      banca_weight: bancaWeight,
      priority_score: priorityScore,
    };
  });

  // Sort by priority score (highest first)
  scored.sort((a, b) => b.priority_score - a.priority_score);

  // Return top 20%
  const cutoff = Math.max(10, Math.ceil(scored.length * 0.2));
  return scored.slice(0, cutoff);
}
