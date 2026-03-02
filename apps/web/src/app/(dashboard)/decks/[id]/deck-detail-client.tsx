"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen } from "lucide-react";
import type { Flashcard } from "@dindin/shared";
import { CreateFlashcardDialog } from "./create-flashcard-dialog";
import { FlashcardItem } from "./flashcard-item";

interface DeckDetailClientProps {
  deckId: string;
  initialFlashcards: Flashcard[];
  limitReached: boolean;
  limitInfo?: string;
}

export function DeckDetailClient({
  deckId,
  initialFlashcards,
  limitReached,
  limitInfo,
}: DeckDetailClientProps) {
  const [flashcards, setFlashcards] = useState(initialFlashcards);

  function handleCreated(card: Flashcard) {
    setFlashcards((prev) => [card, ...prev]);
  }

  function handleDelete(cardId: string) {
    setFlashcards((prev) => prev.filter((c) => c.id !== cardId));
  }

  function handleToggleSuspend(cardId: string) {
    setFlashcards((prev) =>
      prev.map((c) =>
        c.id === cardId ? { ...c, is_suspended: !c.is_suspended } : c,
      ),
    );
  }

  return (
    <>
      <CreateFlashcardDialog
        deckId={deckId}
        limitReached={limitReached}
        limitInfo={limitInfo}
        onCreated={handleCreated}
      />

      {flashcards.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen className="h-12 w-12 text-muted-foreground/50" />
            <p className="mt-4 text-lg font-medium">Nenhum flashcard</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Adicione flashcards a este deck para começar a estudar
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {flashcards.map((card) => (
            <FlashcardItem
              key={card.id}
              flashcard={card}
              onDelete={handleDelete}
              onToggleSuspend={handleToggleSuspend}
            />
          ))}
        </div>
      )}
    </>
  );
}
