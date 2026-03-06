"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import type { Flashcard } from "@dindin/shared";

interface EditFlashcardDialogProps {
  flashcard: Flashcard;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: (updated: Flashcard) => void;
}

export function EditFlashcardDialog({
  flashcard,
  open,
  onOpenChange,
  onSaved,
}: EditFlashcardDialogProps) {
  const [front, setFront] = useState(flashcard.front);
  const [back, setBack] = useState(flashcard.back);
  const [extraContext, setExtraContext] = useState(flashcard.extra_context ?? "");
  const [tags, setTags] = useState(flashcard.tags.join(", "));
  const [isLoading, setIsLoading] = useState(false);

  // Reset fields when opening for a different card
  useEffect(() => {
    if (open) {
      setFront(flashcard.front);
      setBack(flashcard.back);
      setExtraContext(flashcard.extra_context ?? "");
      setTags(flashcard.tags.join(", "));
    }
  }, [open, flashcard]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!front.trim() || !back.trim()) return;
    setIsLoading(true);

    const res = await fetch(`/api/flashcards/${flashcard.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        front: front.trim(),
        back: back.trim(),
        extra_context: extraContext.trim() || null,
        tags: tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      }),
    });

    const data = await res.json();
    setIsLoading(false);

    if (!res.ok) {
      toast.error("Erro ao salvar", { description: data.error });
      return;
    }

    toast.success("Flashcard atualizado");
    onSaved(data.card as Flashcard);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar flashcard</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-front">Frente (pergunta)</Label>
            <Textarea
              id="edit-front"
              value={front}
              onChange={(e) => setFront(e.target.value)}
              required
              rows={3}
              placeholder="Qual o mecanismo de ação dos IECA?"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-back">Verso (resposta)</Label>
            <Textarea
              id="edit-back"
              value={back}
              onChange={(e) => setBack(e.target.value)}
              required
              rows={3}
              placeholder="Inibem a ECA..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-extra">Contexto extra (opcional)</Label>
            <Textarea
              id="edit-extra"
              value={extraContext}
              onChange={(e) => setExtraContext(e.target.value)}
              rows={2}
              placeholder="Referência, página do livro, observação clínica..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-tags">Tags (opcional)</Label>
            <Input
              id="edit-tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="farmacologia, anti-hipertensivos, IECA"
            />
            <p className="text-xs text-muted-foreground">Separe as tags por vírgula</p>
          </div>
          <div className="flex gap-2 justify-end pt-1">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !front.trim() || !back.trim()}
            >
              {isLoading ? "Salvando..." : "Salvar alterações"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
