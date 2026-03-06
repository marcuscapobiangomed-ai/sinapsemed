"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Sparkles, Loader2, Check, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import type { Flashcard } from "@dindin/shared";

interface GeneratedCard {
  type: string;
  front: string;
  back: string;
  banca: string[];
}

interface GenerateCardsDialogProps {
  deckId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (cards: Flashcard[]) => void;
}

const COUNT_OPTIONS = [5, 10, 20] as const;

export function GenerateCardsDialog({
  deckId,
  open,
  onOpenChange,
  onCreated,
}: GenerateCardsDialogProps) {
  const [topic, setTopic] = useState("");
  const [count, setCount] = useState<(typeof COUNT_OPTIONS)[number]>(10);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [preview, setPreview] = useState<GeneratedCard[] | null>(null);

  function handleClose() {
    if (isGenerating || isSaving) return;
    onOpenChange(false);
    setTopic("");
    setPreview(null);
    setCount(10);
  }

  async function handleGenerate() {
    if (!topic.trim()) return;
    setIsGenerating(true);
    setPreview(null);

    try {
      const res = await fetch("/api/ai/generate-batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: topic.trim(), count }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error("Erro ao gerar cards", { description: data.error });
        return;
      }

      setPreview(data.flashcards ?? []);
    } catch {
      toast.error("Erro de conexão. Tente novamente.");
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleSave() {
    if (!preview?.length) return;
    setIsSaving(true);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const inserts = preview.map((card) => ({
      user_id: user!.id,
      deck_id: deckId,
      front: card.front,
      back: card.back,
      source: "ai_generated" as const,
      tags: Array.isArray(card.banca) ? card.banca : [],
    }));

    const { data: savedCards, error } = await supabase
      .from("flashcards")
      .insert(inserts)
      .select();

    setIsSaving(false);

    if (error) {
      toast.error("Erro ao salvar cards", { description: error.message });
      return;
    }

    toast.success(`${savedCards?.length ?? 0} cards adicionados ao deck!`);
    onCreated((savedCards ?? []) as Flashcard[]);
    handleClose();
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col gap-4">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Gerar cards com IA
          </DialogTitle>
        </DialogHeader>

        {/* Form */}
        <div className="space-y-4 shrink-0">
          <div className="flex gap-3 items-end">
            <div className="flex-1 space-y-2">
              <Label htmlFor="gen-topic">Tema ou subtema</Label>
              <Input
                id="gen-topic"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Ex: Insuficiência cardíaca — critérios de Framingham"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !preview) handleGenerate();
                }}
                disabled={isGenerating || isSaving}
              />
            </div>
            <div className="space-y-2 shrink-0">
              <Label>Cards</Label>
              <div className="flex gap-1">
                {COUNT_OPTIONS.map((n) => (
                  <Button
                    key={n}
                    type="button"
                    size="sm"
                    variant={count === n ? "default" : "outline"}
                    onClick={() => setCount(n)}
                    disabled={isGenerating || isSaving}
                    className="px-3 h-9"
                  >
                    {n}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {!preview && (
            <Button
              onClick={handleGenerate}
              disabled={!topic.trim() || isGenerating}
              className="w-full"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Gerando {count} cards...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Gerar {count} cards
                </>
              )}
            </Button>
          )}
        </div>

        {/* Preview */}
        {preview && preview.length > 0 && (
          <div className="flex-1 overflow-y-auto space-y-2 min-h-0">
            <p className="text-sm text-muted-foreground shrink-0">
              {preview.length} cards gerados — revise antes de salvar:
            </p>
            {preview.map((card, i) => (
              <div
                key={i}
                className="rounded-lg border bg-card p-3 space-y-2 text-sm"
              >
                <p className="font-medium leading-relaxed">{card.front}</p>
                <p className="text-muted-foreground border-t pt-2 leading-relaxed">
                  {card.back}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Actions when preview is ready */}
        {preview && (
          <div className="flex gap-2 justify-between shrink-0 pt-1 border-t">
            <Button
              variant="outline"
              onClick={() => {
                setPreview(null);
              }}
              disabled={isSaving}
              size="sm"
            >
              <RefreshCw className="mr-2 h-3.5 w-3.5" />
              Regerar
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Salvar {preview.length} cards
                </>
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
