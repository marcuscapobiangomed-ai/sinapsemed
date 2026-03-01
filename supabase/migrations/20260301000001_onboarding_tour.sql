-- Add onboarding tour tracking column
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS onboarding_tour_completed BOOLEAN DEFAULT FALSE;
