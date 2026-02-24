// ── Bancas ──
export const BANCAS = {
  ENARE: "enare",
  ENAMED: "enamed",
  USP: "usp",
} as const;

export type BancaSlug = (typeof BANCAS)[keyof typeof BANCAS];

export const BANCA_LABELS: Record<BancaSlug, string> = {
  enare: "ENARE - Exame Nacional de Residência",
  enamed: "ENAMED - Exame Nacional de Revalidação",
  usp: "USP - Faculdade de Medicina da USP",
};

// ── Flashcard Sources ──
export const FLASHCARD_SOURCES = {
  MANUAL: "manual",
  EXTENSION_TEXT: "extension_text",
  EXTENSION_IMAGE: "extension_image",
  AI_GENERATED: "ai_generated",
} as const;

export type FlashcardSource =
  (typeof FLASHCARD_SOURCES)[keyof typeof FLASHCARD_SOURCES];

// ── Review Ratings (FSRS) ──
export const REVIEW_RATINGS = {
  AGAIN: "again",
  HARD: "hard",
  GOOD: "good",
  EASY: "easy",
} as const;

export type ReviewRating =
  (typeof REVIEW_RATINGS)[keyof typeof REVIEW_RATINGS];

// ── Gap Severity ──
export const GAP_SEVERITIES = {
  CRITICAL: "critical",
  MODERATE: "moderate",
  MINOR: "minor",
} as const;

export type GapSeverity =
  (typeof GAP_SEVERITIES)[keyof typeof GAP_SEVERITIES];

// ── Subscription ──
export const SUBSCRIPTION_STATUS = {
  ACTIVE: "active",
  CANCELED: "canceled",
  PAST_DUE: "past_due",
  TRIALING: "trialing",
} as const;

export type SubscriptionStatus =
  (typeof SUBSCRIPTION_STATUS)[keyof typeof SUBSCRIPTION_STATUS];

// ── Planos ──
export const PLAN_LIMITS = {
  free: {
    maxFlashcardsPerMonth: 50,
    maxDoubtsPerDay: 5,
    maxBancas: 1,
    hasDashboardPrediction: false,
    hasPriorityAI: false,
  },
  pro_monthly: {
    maxFlashcardsPerMonth: null, // ilimitado
    maxDoubtsPerDay: null,
    maxBancas: null,
    hasDashboardPrediction: true,
    hasPriorityAI: true,
  },
  pro_annual: {
    maxFlashcardsPerMonth: null,
    maxDoubtsPerDay: null,
    maxBancas: null,
    hasDashboardPrediction: true,
    hasPriorityAI: true,
  },
} as const;

// ── FSRS States ──
export const FSRS_STATES = {
  NEW: 0,
  LEARNING: 1,
  REVIEW: 2,
  RELEARNING: 3,
} as const;

export type FSRSState = (typeof FSRS_STATES)[keyof typeof FSRS_STATES];
