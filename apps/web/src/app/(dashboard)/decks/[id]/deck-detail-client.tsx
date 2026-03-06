"use client";

import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BookOpen, Search, Sparkles } from "lucide-react";
import type { Flashcard } from "@dindin/shared";
import { CreateFlashcardDialog } from "./create-flashcard-dialog";
import { FlashcardItem } from "./flashcard-item";
import { GenerateCardsDialog } from "./generate-cards-dialog";

type StateFilter = "all" | "0" | "1" | "2" | "suspended";

const STATE_FILTER_LABELS: Record<StateFilter, string> = {
  all: "Todos",
  "0": "Novo",
  "1": "Aprendendo",
  "2": "Revisão",
  suspended: "Pausados",
};

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
  const [search, setSearch] = useState("");
  const [stateFilter, setStateFilter] = useState<StateFilter>("all");
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);

  function handleCreated(card: Flashcard) {
    setFlashcards((prev) => [card, ...prev]);
  }

  function handleCreatedBatch(cards: Flashcard[]) {
    setFlashcards((prev) => [...cards, ...prev]);
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

  function handleEdit(updated: Flashcard) {
    setFlashcards((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return flashcards.filter((c) => {
      // State filter
      if (stateFilter === "suspended") {
        if (!c.is_suspended) return false;
      } else if (stateFilter !== "all") {
        if (c.is_suspended) return false;
        if (String(c.fsrs_state) !== stateFilter) return false;
      }
      // Text search
      if (!q) return true;
      return (
        c.front.toLowerCase().includes(q) ||
        c.back.toLowerCase().includes(q) ||
        c.tags.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [flashcards, search, stateFilter]);

  return (
    <>
      {/* Toolbar */}
      <div className="space-y-3">
        {/* Row 1: search + action buttons */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Buscar por frente, verso ou tag..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowGenerateDialog(true)}
            className="shrink-0"
          >
            <Sparkles className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Gerar com IA</span>
            <span className="sm:hidden">IA</span>
          </Button>
          <div className="shrink-0">
            <CreateFlashcardDialog
              deckId={deckId}
              limitReached={limitReached}
              limitInfo={limitInfo}
              onCreated={handleCreated}
            />
          </div>
        </div>

        {/* Row 2: state filter pills */}
        <div className="flex items-center gap-1 flex-wrap">
          {(Object.keys(STATE_FILTER_LABELS) as StateFilter[]).map((s) => (
            <Button
              key={s}
              variant={stateFilter === s ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setStateFilter(s)}
              className="text-xs h-7 px-2.5"
            >
              {STATE_FILTER_LABELS[s]}
            </Button>
          ))}
        </div>
      </div>

      {/* Cards list */}
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
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <Search className="h-10 w-10 text-muted-foreground/40" />
            <p className="mt-3 text-sm font-medium">Nenhum card encontrado</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Tente ajustar a busca ou o filtro
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {(search || stateFilter !== "all") && (
            <p className="text-xs text-muted-foreground">
              {filtered.length} de {flashcards.length} cards
            </p>
          )}
          {filtered.map((card) => (
            <FlashcardItem
              key={card.id}
              flashcard={card}
              onDelete={handleDelete}
              onToggleSuspend={handleToggleSuspend}
              onEdit={handleEdit}
            />
          ))}
        </div>
      )}

      <GenerateCardsDialog
        deckId={deckId}
        open={showGenerateDialog}
        onOpenChange={setShowGenerateDialog}
        onCreated={handleCreatedBatch}
      />
    </>
  );
}
