import type {
  BancaSlug,
  FlashcardSource,
  ReviewRating,
  GapSeverity,
  SubscriptionStatus,
  FSRSState,
} from "./constants";

// ── Database Row Types ──
// Estes tipos espelham as tabelas do Supabase

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  medical_school: string | null;
  graduation_year: number | null;
  target_year: number;
  study_hours_per_day: number;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface Banca {
  id: string;
  slug: BancaSlug;
  name: string;
  description: string | null;
  institution: string | null;
  typical_exam_month: number | null;
  total_questions_avg: number | null;
  specialty_weights: Record<string, number> | null;
  is_active: boolean;
  system_prompt: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserBanca {
  id: string;
  user_id: string;
  banca_id: string;
  is_primary: boolean;
  priority: number;
  created_at: string;
}

export interface Specialty {
  id: string;
  slug: string;
  name: string;
  parent_id: string | null;
  created_at: string;
}

export interface Deck {
  id: string;
  user_id: string;
  specialty_id: string | null;
  banca_id: string | null;
  title: string;
  description: string | null;
  color: string;
  is_archived: boolean;
  card_count: number;
  created_at: string;
  updated_at: string;
}

export interface Flashcard {
  id: string;
  user_id: string;
  deck_id: string;
  front: string;
  back: string;
  front_image_url: string | null;
  back_image_url: string | null;
  extra_context: string | null;
  tags: string[];
  source_url: string | null;
  source: FlashcardSource;
  specialty_id: string | null;
  banca_id: string | null;
  fsrs_stability: number;
  fsrs_difficulty: number;
  fsrs_elapsed_days: number;
  fsrs_scheduled_days: number;
  fsrs_reps: number;
  fsrs_lapses: number;
  fsrs_state: FSRSState;
  fsrs_last_review: string | null;
  next_review_at: string | null;
  is_ai_enriched: boolean;
  is_suspended: boolean;
  created_at: string;
  updated_at: string;
}

export interface Review {
  id: string;
  user_id: string;
  flashcard_id: string;
  rating: ReviewRating;
  response_time_ms: number | null;
  fsrs_stability_before: number | null;
  fsrs_difficulty_before: number | null;
  fsrs_state_before: number | null;
  scheduled_for: string | null;
  reviewed_at: string;
}

export interface KnowledgeGap {
  id: string;
  user_id: string;
  topic: string;
  description: string;
  specialty_id: string | null;
  banca_id: string | null;
  severity: GapSeverity;
  source_flashcard_ids: string[];
  source_review_ids: string[];
  error_pattern: string | null;
  is_resolved: boolean;
  resolved_at: string | null;
  confidence_score: number;
  created_at: string;
  updated_at: string;
}

export interface Plan {
  id: string;
  slug: string;
  name: string;
  price_brl: number;
  interval: string;
  stripe_price_id: string | null;
  max_flashcards_per_month: number | null;
  max_doubts_per_day: number | null;
  max_bancas: number | null;
  has_dashboard_prediction: boolean;
  has_priority_ai: boolean;
  is_active: boolean;
  created_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  plan_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  status: SubscriptionStatus;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
}

export interface StudySession {
  id: string;
  user_id: string;
  session_type: string;
  deck_id: string | null;
  banca_id: string | null;
  cards_reviewed: number;
  cards_correct: number;
  cards_incorrect: number;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number | null;
}

// ── API Request/Response Types ──

export interface CreateFlashcardInput {
  deck_id: string;
  front: string;
  back: string;
  front_image_url?: string;
  back_image_url?: string;
  extra_context?: string;
  tags?: string[];
  source_url?: string;
  source?: FlashcardSource;
}

export interface CreateDeckInput {
  title: string;
  description?: string;
  specialty_id?: string;
  banca_id?: string;
  color?: string;
}

export interface ReviewInput {
  flashcard_id: string;
  rating: ReviewRating;
  response_time_ms?: number;
}

export interface OnboardingInput {
  full_name: string;
  medical_school?: string;
  graduation_year?: number;
  target_year: number;
  study_hours_per_day: number;
  banca_ids: string[];
  primary_banca_id: string;
}
