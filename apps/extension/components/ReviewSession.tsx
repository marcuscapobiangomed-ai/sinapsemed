import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { WEB_APP_URL } from "@/lib/config";

interface ReviewCard {
  id: string;
  front: string;
  back: string;
  extra_context: string | null;
  tags: string[];
  fsrs_state: number;
}

interface ReviewSessionProps {
  authToken: string;
  onCountChange?: (due: number) => void;
}

const RATING_CONFIG = [
  { rating: "again", label: "De novo", color: "bg-red-500 hover:bg-red-600", key: "1" },
  { rating: "hard",  label: "Difícil",  color: "bg-orange-500 hover:bg-orange-600", key: "2" },
  { rating: "good",  label: "Bom",     color: "bg-green-500 hover:bg-green-600", key: "3" },
  { rating: "easy",  label: "Fácil",   color: "bg-blue-500 hover:bg-blue-600", key: "4" },
] as const;

export function ReviewSession({ authToken, onCountChange }: ReviewSessionProps) {
  const [cards, setCards] = useState<ReviewCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showBack, setShowBack] = useState(false);
  const [isRating, setIsRating] = useState(false);
  const [reviewed, setReviewed] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [loadingCards, setLoadingCards] = useState(true);
  const [error, setError] = useState("");
  const startTimeRef = useRef(Date.now());

  useEffect(() => {
    async function loadCards() {
      setLoadingCards(true);
      setError("");
      const now = new Date().toISOString();
      const { data, error: fetchError } = await supabase
        .from("flashcards")
        .select("id, front, back, extra_context, tags, fsrs_state")
        .eq("is_suspended", false)
        .lte("next_review_at", now)
        .order("next_review_at", { ascending: true })
        .limit(20);

      if (fetchError) {
        setError("Erro ao carregar cards");
      } else {
        setCards(data ?? []);
      }
      setLoadingCards(false);
    }
    loadCards();
  }, []);

  const handleRating = useCallback(
    async (rating: string) => {
      const currentCard = cards[currentIndex];
      if (isRating || !currentCard) return;
      setIsRating(true);

      try {
        await fetch(`${WEB_APP_URL}/api/reviews/rate`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({ flashcard_id: currentCard.id, rating }),
        });
      } catch {
        // Silent fail — still advance
      }

      const isCorrect = rating === "good" || rating === "easy";
      setReviewed((prev) => prev + 1);
      if (isCorrect) setCorrectCount((prev) => prev + 1);

      setShowBack(false);
      setCurrentIndex((prev) => prev + 1);
      startTimeRef.current = Date.now();
      setIsRating(false);
    },
    [cards, currentIndex, isRating, authToken],
  );

  // Keyboard shortcuts
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!showBack) {
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          setShowBack(true);
        }
        return;
      }
      const config = RATING_CONFIG.find((r) => r.key === e.key);
      if (config) handleRating(config.rating);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showBack, handleRating]);

  if (loadingCards) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-16">
        <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-16 px-6 text-center">
        <p className="text-sm text-red-600">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-3 text-xs text-brand-600 hover:underline"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-16 px-6 text-center">
        <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center mb-3">
          <span className="text-3xl">🎉</span>
        </div>
        <p className="text-sm font-semibold text-gray-800 mb-1">Tudo em dia!</p>
        <p className="text-xs text-gray-400 leading-relaxed">
          Nenhum card para revisar agora. Continue assim!
        </p>
      </div>
    );
  }

  const currentCard = cards[currentIndex];
  const isFinished = currentIndex >= cards.length;

  // Session complete screen
  if (isFinished) {
    const accuracy = reviewed > 0 ? Math.round((correctCount / reviewed) * 100) : 0;

    // Notify parent to refresh due count
    onCountChange?.(0);

    return (
      <div className="flex flex-col items-center justify-center h-full py-16 px-6 text-center">
        <div className="w-14 h-14 bg-brand-50 rounded-2xl flex items-center justify-center mb-4">
          <span className="text-3xl">🧠</span>
        </div>
        <p className="text-3xl font-bold text-brand-700">{accuracy}%</p>
        <p className="text-sm text-gray-500 mt-1">Taxa de acerto</p>
        <div className="flex gap-6 mt-4 text-xs text-gray-400">
          <span>{reviewed} revisados</span>
          <span>{correctCount} corretos</span>
        </div>
        <button
          onClick={() => {
            setCurrentIndex(0);
            setReviewed(0);
            setCorrectCount(0);
            setShowBack(false);
            setLoadingCards(true);
            // Reload cards
            const now = new Date().toISOString();
            supabase
              .from("flashcards")
              .select("id, front, back, extra_context, tags, fsrs_state")
              .eq("is_suspended", false)
              .lte("next_review_at", now)
              .order("next_review_at", { ascending: true })
              .limit(20)
              .then(({ data }) => {
                setCards(data ?? []);
                setLoadingCards(false);
              });
          }}
          className="mt-6 px-6 py-2 bg-brand-600 text-white rounded-xl text-xs font-medium hover:bg-brand-700 transition-colors"
        >
          Revisar mais
        </button>
      </div>
    );
  }

  const progress = (reviewed / cards.length) * 100;

  return (
    <div className="flex flex-col h-full px-3 py-3">
      {/* Progress */}
      <div className="flex items-center justify-between text-[11px] text-gray-400 mb-2 flex-shrink-0">
        <span>{reviewed + 1} / {cards.length}</span>
        {currentCard.tags.length > 0 && (
          <span className="px-2 py-0.5 bg-brand-50 text-brand-600 rounded-full text-[10px] font-medium">
            {currentCard.tags[0]}
          </span>
        )}
      </div>

      {/* Progress bar */}
      <div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden mb-3 flex-shrink-0">
        <div
          className="h-full bg-brand-500 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Card */}
      <div
        className="flex-1 min-h-0 bg-gray-50 border border-gray-200 rounded-2xl flex flex-col items-center justify-center cursor-pointer p-6 text-center transition-all active:scale-[0.99]"
        onClick={() => !showBack && setShowBack(true)}
      >
        <p className="text-sm font-medium text-gray-900 leading-relaxed">{currentCard.front}</p>

        {showBack && (
          <>
            <div className="my-4 w-full border-t border-gray-200" />
            <p className="text-sm text-gray-600 leading-relaxed">{currentCard.back}</p>
            {currentCard.extra_context && (
              <p className="mt-3 text-xs text-gray-400 italic border-t border-gray-100 pt-3 w-full">
                {currentCard.extra_context}
              </p>
            )}
          </>
        )}

        {!showBack && (
          <p className="mt-4 text-xs text-gray-400">Toque para ver a resposta</p>
        )}
      </div>

      {/* Rating buttons */}
      {showBack ? (
        <div className="grid grid-cols-4 gap-1.5 mt-3 flex-shrink-0">
          {RATING_CONFIG.map(({ rating, label, color, key }) => (
            <button
              key={rating}
              onClick={() => handleRating(rating)}
              disabled={isRating}
              className={`${color} text-white py-2 rounded-xl text-xs font-medium transition-all disabled:opacity-60 active:scale-95`}
            >
              <span className="block text-[9px] opacity-60 mb-0.5">{key}</span>
              {label}
            </button>
          ))}
        </div>
      ) : (
        <div className="mt-3 flex-shrink-0">
          <button
            onClick={() => setShowBack(true)}
            className="w-full py-2.5 bg-brand-600 text-white rounded-xl text-xs font-medium hover:bg-brand-700 transition-colors"
          >
            Ver resposta <span className="opacity-60 ml-1">[espaço]</span>
          </button>
        </div>
      )}
    </div>
  );
}
