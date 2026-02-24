"use client";

import { RotateCw } from "lucide-react";

interface FlashcardFlipProps {
  front: string;
  back: string;
  extraContext: string | null;
  isFlipped: boolean;
  onFlip: () => void;
}

export function FlashcardFlip({
  front,
  back,
  extraContext,
  isFlipped,
  onFlip,
}: FlashcardFlipProps) {
  return (
    <div
      className="perspective-1000 cursor-pointer animate-card-in"
      onClick={onFlip}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          onFlip();
        }
      }}
    >
      <div className={`flip-card-inner min-h-[320px] ${isFlipped ? "flipped" : ""}`}>
        {/* Frente */}
        <div className="flip-card-front absolute inset-0 rounded-xl border bg-card shadow-sm flex flex-col items-center justify-center p-8">
          <p className="text-xl font-semibold text-center leading-relaxed max-w-lg">
            {front}
          </p>

          <div className="mt-8 flex items-center gap-2 text-sm text-muted-foreground animate-pulse">
            <RotateCw className="h-4 w-4" />
            <span>Toque para virar</span>
          </div>
        </div>

        {/* Verso */}
        <div className="flip-card-back absolute inset-0 rounded-xl border bg-card shadow-sm flex flex-col items-center justify-center p-8">
          {/* Gradiente sutil no topo */}
          <div className="absolute inset-x-0 top-0 h-1 rounded-t-xl bg-gradient-to-r from-brand-500 via-brand-400 to-brand-600" />

          <p className="text-lg text-center leading-relaxed max-w-lg">
            {back}
          </p>

          {extraContext && (
            <p className="mt-6 text-sm text-muted-foreground/70 italic text-center max-w-lg border-t pt-4">
              {extraContext}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
