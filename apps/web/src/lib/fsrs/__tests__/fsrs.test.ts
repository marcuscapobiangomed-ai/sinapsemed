import { describe, it, expect } from "vitest";
import { Rating, State } from "ts-fsrs";
import {
  createNewCard,
  scheduleReview,
  dbToFSRSCard,
  fsrsCardToDBFields,
  ratingStringToEnum,
} from "../index";

describe("createNewCard", () => {
  it("returns a card with NEW state", () => {
    const card = createNewCard();
    expect(card.state).toBe(State.New);
  });

  it("returns a card with zero reps and lapses", () => {
    const card = createNewCard();
    expect(card.reps).toBe(0);
    expect(card.lapses).toBe(0);
  });

  it("returns a card with a due date", () => {
    const card = createNewCard();
    expect(card.due).toBeInstanceOf(Date);
  });
});

describe("scheduleReview", () => {
  it("moves a new card to Learning on Rating.Good", () => {
    const card = createNewCard();
    const result = scheduleReview(card, Rating.Good);
    expect(result.card.state).toBe(State.Learning);
    expect(result.card.reps).toBe(1);
  });

  it("moves a new card to Learning on Rating.Again", () => {
    const card = createNewCard();
    const result = scheduleReview(card, Rating.Again);
    expect(result.card.state).toBe(State.Learning);
    expect(result.card.lapses).toBe(0); // No lapses on first review
  });

  it("produces longer intervals for Easy than Good on new card", () => {
    const card = createNewCard();
    const now = new Date("2026-01-15T10:00:00Z");

    const resultGood = scheduleReview(card, Rating.Good, now);
    const resultEasy = scheduleReview(card, Rating.Easy, now);

    expect(resultEasy.card.scheduled_days).toBeGreaterThanOrEqual(
      resultGood.card.scheduled_days,
    );
  });

  it("produces shorter intervals for Hard than Good on new card", () => {
    const card = createNewCard();
    const now = new Date("2026-01-15T10:00:00Z");

    const resultHard = scheduleReview(card, Rating.Hard, now);
    const resultGood = scheduleReview(card, Rating.Good, now);

    expect(resultHard.card.scheduled_days).toBeLessThanOrEqual(
      resultGood.card.scheduled_days,
    );
  });

  it("accepts a custom date parameter", () => {
    const card = createNewCard();
    const customDate = new Date("2026-06-15T12:00:00Z");
    const result = scheduleReview(card, Rating.Good, customDate);
    expect(result.card).toBeDefined();
    expect(result.card.last_review).toBeDefined();
  });

  it("increases reps count after review", () => {
    const card = createNewCard();
    const result = scheduleReview(card, Rating.Good);
    expect(result.card.reps).toBe(1);

    const result2 = scheduleReview(result.card, Rating.Good);
    expect(result2.card.reps).toBe(2);
  });
});

describe("dbToFSRSCard", () => {
  it("converts DB fields to FSRS Card", () => {
    const dbCard = {
      fsrs_stability: 5.5,
      fsrs_difficulty: 6.2,
      fsrs_elapsed_days: 3,
      fsrs_scheduled_days: 7,
      fsrs_reps: 4,
      fsrs_lapses: 1,
      fsrs_state: State.Review,
      fsrs_last_review: "2026-01-10T10:00:00.000Z",
    };

    const card = dbToFSRSCard(dbCard);

    expect(card.stability).toBe(5.5);
    expect(card.difficulty).toBe(6.2);
    expect(card.elapsed_days).toBe(3);
    expect(card.scheduled_days).toBe(7);
    expect(card.reps).toBe(4);
    expect(card.lapses).toBe(1);
    expect(card.state).toBe(State.Review);
    expect(card.last_review).toBeInstanceOf(Date);
    expect(card.last_review!.toISOString()).toBe("2026-01-10T10:00:00.000Z");
  });

  it("handles null fsrs_last_review", () => {
    const dbCard = {
      fsrs_stability: 0,
      fsrs_difficulty: 0,
      fsrs_elapsed_days: 0,
      fsrs_scheduled_days: 0,
      fsrs_reps: 0,
      fsrs_lapses: 0,
      fsrs_state: State.New,
      fsrs_last_review: null,
    };

    const card = dbToFSRSCard(dbCard);
    expect(card.last_review).toBeUndefined();
  });

  it("handles state as number correctly", () => {
    const dbCard = {
      fsrs_stability: 0,
      fsrs_difficulty: 0,
      fsrs_elapsed_days: 0,
      fsrs_scheduled_days: 0,
      fsrs_reps: 0,
      fsrs_lapses: 0,
      fsrs_state: 2, // State.Review as number
      fsrs_last_review: null,
    };

    const card = dbToFSRSCard(dbCard);
    expect(card.state).toBe(State.Review);
  });
});

describe("fsrsCardToDBFields", () => {
  it("converts FSRS Card to DB fields", () => {
    const card = createNewCard();
    const reviewed = scheduleReview(card, Rating.Good);
    const fields = fsrsCardToDBFields(reviewed.card);

    expect(fields).toHaveProperty("fsrs_stability");
    expect(fields).toHaveProperty("fsrs_difficulty");
    expect(fields).toHaveProperty("fsrs_elapsed_days");
    expect(fields).toHaveProperty("fsrs_scheduled_days");
    expect(fields).toHaveProperty("fsrs_reps");
    expect(fields).toHaveProperty("fsrs_lapses");
    expect(fields).toHaveProperty("fsrs_state");
    expect(fields).toHaveProperty("fsrs_last_review");
    expect(fields).toHaveProperty("next_review_at");
  });

  it("returns ISO strings for dates", () => {
    const card = createNewCard();
    const reviewed = scheduleReview(card, Rating.Good);
    const fields = fsrsCardToDBFields(reviewed.card);

    expect(fields.next_review_at).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/,
    );
    if (fields.fsrs_last_review) {
      expect(fields.fsrs_last_review).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/,
      );
    }
  });

  it("returns null for last_review when card has no last_review", () => {
    const card = createNewCard();
    const fields = fsrsCardToDBFields(card);
    expect(fields.fsrs_last_review).toBeNull();
  });

  it("returns state as number", () => {
    const card = createNewCard();
    const fields = fsrsCardToDBFields(card);
    expect(typeof fields.fsrs_state).toBe("number");
  });

  it("round-trips with dbToFSRSCard correctly", () => {
    const originalCard = createNewCard();
    const reviewed = scheduleReview(originalCard, Rating.Good);
    const dbFields = fsrsCardToDBFields(reviewed.card);

    const reconstructed = dbToFSRSCard({
      fsrs_stability: dbFields.fsrs_stability,
      fsrs_difficulty: dbFields.fsrs_difficulty,
      fsrs_elapsed_days: dbFields.fsrs_elapsed_days,
      fsrs_scheduled_days: dbFields.fsrs_scheduled_days,
      fsrs_reps: dbFields.fsrs_reps,
      fsrs_lapses: dbFields.fsrs_lapses,
      fsrs_state: dbFields.fsrs_state,
      fsrs_last_review: dbFields.fsrs_last_review,
    });

    expect(reconstructed.stability).toBe(reviewed.card.stability);
    expect(reconstructed.difficulty).toBe(reviewed.card.difficulty);
    expect(reconstructed.reps).toBe(reviewed.card.reps);
    expect(reconstructed.lapses).toBe(reviewed.card.lapses);
    expect(reconstructed.state).toBe(reviewed.card.state);
  });
});

describe("ratingStringToEnum", () => {
  it('maps "again" to Rating.Again', () => {
    expect(ratingStringToEnum("again")).toBe(Rating.Again);
  });

  it('maps "hard" to Rating.Hard', () => {
    expect(ratingStringToEnum("hard")).toBe(Rating.Hard);
  });

  it('maps "good" to Rating.Good', () => {
    expect(ratingStringToEnum("good")).toBe(Rating.Good);
  });

  it('maps "easy" to Rating.Easy', () => {
    expect(ratingStringToEnum("easy")).toBe(Rating.Easy);
  });

  it("defaults to Rating.Good for unknown strings", () => {
    expect(ratingStringToEnum("unknown")).toBe(Rating.Good);
    expect(ratingStringToEnum("")).toBe(Rating.Good);
  });
});
