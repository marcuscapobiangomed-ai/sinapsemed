import {
  createEmptyCard,
  fsrs,
  generatorParameters,
  type Card as FSRSCard,
  Rating,
  State,
} from "ts-fsrs";

// Initialize FSRS with default parameters
const params = generatorParameters();
const scheduler = fsrs(params);

export { Rating, State };
export type { FSRSCard };

/**
 * Creates a new FSRS card with default values
 */
export function createNewCard(): FSRSCard {
  return createEmptyCard();
}

/**
 * Result of scheduling a review
 */
export interface ScheduleResult {
  card: FSRSCard;
}

/**
 * Schedules the next review for a card based on user's rating.
 * Returns the updated card state.
 */
export function scheduleReview(
  card: FSRSCard,
  rating: Rating,
  now?: Date,
): ScheduleResult {
  const reviewDate = now ?? new Date();
  const result = scheduler.repeat(card, reviewDate);
  // result is indexed by Rating enum value (1=Again, 2=Hard, 3=Good, 4=Easy)
  const entry = (result as unknown as Record<number, { card: FSRSCard }>)[rating as number];
  return { card: entry.card };
}

/**
 * Converts our DB flashcard fields to a ts-fsrs Card object
 */
export function dbToFSRSCard(dbCard: {
  fsrs_stability: number;
  fsrs_difficulty: number;
  fsrs_elapsed_days: number;
  fsrs_scheduled_days: number;
  fsrs_reps: number;
  fsrs_lapses: number;
  fsrs_state: number;
  fsrs_last_review: string | null;
}): FSRSCard {
  return {
    stability: dbCard.fsrs_stability,
    difficulty: dbCard.fsrs_difficulty,
    elapsed_days: dbCard.fsrs_elapsed_days,
    scheduled_days: dbCard.fsrs_scheduled_days,
    reps: dbCard.fsrs_reps,
    lapses: dbCard.fsrs_lapses,
    state: dbCard.fsrs_state as State,
    due: new Date(),
    last_review: dbCard.fsrs_last_review
      ? new Date(dbCard.fsrs_last_review)
      : undefined,
  };
}

/**
 * Converts a ts-fsrs Card back to DB fields for updating
 */
export function fsrsCardToDBFields(card: FSRSCard) {
  return {
    fsrs_stability: card.stability,
    fsrs_difficulty: card.difficulty,
    fsrs_elapsed_days: card.elapsed_days,
    fsrs_scheduled_days: card.scheduled_days,
    fsrs_reps: card.reps,
    fsrs_lapses: card.lapses,
    fsrs_state: card.state as number,
    fsrs_last_review: card.last_review
      ? card.last_review.toISOString()
      : null,
    next_review_at: card.due.toISOString(),
  };
}

/**
 * Maps our rating strings to FSRS Rating enum
 */
export function ratingStringToEnum(rating: string): Rating {
  switch (rating) {
    case "again":
      return Rating.Again;
    case "hard":
      return Rating.Hard;
    case "good":
      return Rating.Good;
    case "easy":
      return Rating.Easy;
    default:
      return Rating.Good;
  }
}
