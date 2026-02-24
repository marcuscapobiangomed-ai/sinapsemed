"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import {
  dbToFSRSCard,
  fsrsCardToDBFields,
  scheduleReview,
  ratingStringToEnum,
} from "@/lib/fsrs";
import { RotateCcw, AlertCircle, Check, Zap } from "lucide-react";
import { FlashcardFlip } from "./flashcard-flip";
import { SessionSummary } from "./session-summary";

interface ReviewCard {
  id: string;
  front: string;
  back: string;
  extra_context: string | null;
  tags: string[];
  fsrs_stability: number;
  fsrs_difficulty: number;
  fsrs_elapsed_days: number;
  fsrs_scheduled_days: number;
  fsrs_reps: number;
  fsrs_lapses: number;
  fsrs_state: number;
  fsrs_last_review: string | null;
  decks: { title: string; color: string } | null;
}

interface ReviewSessionProps {
  initialCards: ReviewCard[];
  totalCount: number;
}

const RATING_CONFIG = [
  { rating: "again" as const, label: "De novo", shortcut: "1", color: "bg-rating-again hover:bg-rating-again/90", icon: RotateCcw },
  { rating: "hard" as const, label: "Difícil", shortcut: "2", color: "bg-rating-hard hover:bg-rating-hard/90", icon: AlertCircle },
  { rating: "good" as const, label: "Bom", shortcut: "3", color: "bg-rating-good hover:bg-rating-good/90", icon: Check },
  { rating: "easy" as const, label: "Fácil", shortcut: "4", color: "bg-rating-easy hover:bg-rating-easy/90", icon: Zap },
];

function formatInterval(days: number): string {
  if (days < 1) return "< 10min";
  if (days === 1) return "1d";
  if (days < 30) return `${Math.round(days)}d`;
  const months = Math.round(days / 30);
  return `${months}mo`;
}

export function ReviewSession({ initialCards, totalCount }: ReviewSessionProps) {
  const [cards] = useState(initialCards);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showBack, setShowBack] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reviewed, setReviewed] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [ratingBreakdown, setRatingBreakdown] = useState({
    again: 0,
    hard: 0,
    good: 0,
    easy: 0,
  });
  const startTimeRef = useRef(Date.now());
  const sessionStartRef = useRef(Date.now());

  const currentCard = cards[currentIndex];
  const isFinished = currentIndex >= cards.length;

  // FSRS preview intervals for current card
  const previews = useMemo(() => {
    if (!currentCard) return {};
    const fsrsCard = dbToFSRSCard(currentCard);
    const map: Record<string, number> = {};
    for (const { rating } of RATING_CONFIG) {
      const result = scheduleReview(fsrsCard, ratingStringToEnum(rating));
      map[rating] = result.card.scheduled_days;
    }
    return map;
  }, [currentCard]);

  const handleRating = useCallback(
    async (ratingStr: string) => {
      if (isSubmitting || !currentCard) return;
      setIsSubmitting(true);

      const responseTimeMs = Date.now() - startTimeRef.current;
      const ratingEnum = ratingStringToEnum(ratingStr);

      // Calculate FSRS
      const fsrsCard = dbToFSRSCard(currentCard);
      const result = scheduleReview(fsrsCard, ratingEnum);
      const updatedFields = fsrsCardToDBFields(result.card);

      const supabase = createClient();

      // Update flashcard with new FSRS values
      const { error: updateError } = await supabase
        .from("flashcards")
        .update(updatedFields)
        .eq("id", currentCard.id);

      if (updateError) {
        toast.error("Erro ao salvar revisão");
        setIsSubmitting(false);
        return;
      }

      // Save review log
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from("reviews").insert({
        user_id: user!.id,
        flashcard_id: currentCard.id,
        rating: ratingStr,
        response_time_ms: responseTimeMs,
        fsrs_stability_before: currentCard.fsrs_stability,
        fsrs_difficulty_before: currentCard.fsrs_difficulty,
        fsrs_state_before: currentCard.fsrs_state,
      });

      // Update counters
      setReviewed((prev) => prev + 1);
      if (ratingStr === "good" || ratingStr === "easy") {
        setCorrectCount((prev) => prev + 1);
      }
      setRatingBreakdown((prev) => ({
        ...prev,
        [ratingStr]: prev[ratingStr as keyof typeof prev] + 1,
      }));

      // Next card
      setShowBack(false);
      setCurrentIndex((prev) => prev + 1);
      startTimeRef.current = Date.now();
      setIsSubmitting(false);
    },
    [currentCard, isSubmitting],
  );

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (e.key === " " && !showBack && !isFinished) {
        e.preventDefault();
        setShowBack(true);
        return;
      }

      if (showBack && !isSubmitting) {
        const shortcutMap: Record<string, string> = {
          "1": "again",
          "2": "hard",
          "3": "good",
          "4": "easy",
        };
        const rating = shortcutMap[e.key];
        if (rating) {
          e.preventDefault();
          handleRating(rating);
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showBack, isSubmitting, isFinished, handleRating]);

  // Session finished
  if (isFinished) {
    return (
      <SessionSummary
        reviewed={reviewed}
        correctCount={correctCount}
        ratingBreakdown={ratingBreakdown}
        sessionDurationMs={Date.now() - sessionStartRef.current}
      />
    );
  }

  const progressPct = cards.length > 0 ? Math.round((reviewed / cards.length) * 100) : 0;

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Progress */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {reviewed + 1} / {Math.min(cards.length, totalCount)}{" "}
          <span className="text-xs">({progressPct}%)</span>
        </span>
        {currentCard.decks && (
          <Badge variant="outline" className="gap-1.5">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: currentCard.decks.color }}
            />
            {currentCard.decks.title}
          </Badge>
        )}
      </div>

      {/* Progress bar */}
      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-brand-500 to-brand-600 rounded-full transition-all duration-300"
          style={{ width: `${(reviewed / cards.length) * 100}%` }}
        />
      </div>

      {/* Flashcard with 3D flip */}
      <FlashcardFlip
        key={currentCard.id}
        front={currentCard.front}
        back={currentCard.back}
        extraContext={currentCard.extra_context}
        isFlipped={showBack}
        onFlip={() => !showBack && setShowBack(true)}
      />

      {/* Rating buttons */}
      {showBack && (
        <div className="grid grid-cols-4 gap-2 animate-card-in">
          {RATING_CONFIG.map(({ rating, label, shortcut, color, icon: Icon }) => (
            <Button
              key={rating}
              onClick={() => handleRating(rating)}
              disabled={isSubmitting}
              className={`${color} text-white flex flex-col h-auto py-2.5 gap-0.5 transition-all duration-200 hover:scale-105`}
            >
              <span className="flex items-center gap-1.5">
                <Icon className="h-3.5 w-3.5" />
                <span className="text-xs sm:text-sm">{label}</span>
              </span>
              <span className="text-[10px] opacity-70">
                {formatInterval(previews[rating] ?? 0)}
                <span className="hidden sm:inline ml-1">&middot; {shortcut}</span>
              </span>
            </Button>
          ))}
        </div>
      )}

      {/* Tags */}
      {currentCard.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 justify-center">
          {currentCard.tags.map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
