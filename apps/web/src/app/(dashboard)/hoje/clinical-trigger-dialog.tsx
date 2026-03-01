"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Stethoscope,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface GeneratedCard {
  type: "qa" | "cloze";
  front: string;
  back: string;
}

interface ClinicalTriggerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Step = "input" | "preview" | "done";

export function ClinicalTriggerDialog({
  open,
  onOpenChange,
}: ClinicalTriggerDialogProps) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("input");
  const [topic, setTopic] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [cards, setCards] = useState<GeneratedCard[]>([]);
  const [selected, setSelected] = useState<boolean[]>([]);
  const [savedCount, setSavedCount] = useState(0);

  function reset() {
    setStep("input");
    setTopic("");
    setCards([]);
    setSelected([]);
    setSavedCount(0);
  }

  function handleClose(open: boolean) {
    if (!open) reset();
    onOpenChange(open);
  }

  async function handleGenerate() {
    if (topic.trim().length < 3) return;

    setIsGenerating(true);
    try {
      const res = await fetch("/api/ai/generate-batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: topic.trim(), count: 5 }),
      });

      if (res.status === 403) {
        toast.error("Recurso Premium", {
          description: "O gatilho clínico está disponível no plano Premium.",
          action: {
            label: "Ver planos",
            onClick: () => router.push("/settings"),
          },
        });
        return;
      }

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Erro ao gerar flashcards");
        return;
      }

      const data = await res.json();
      setCards(data.flashcards);
      setSelected(data.flashcards.map(() => true));
      setStep("preview");
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleSave() {
    const toSave = cards.filter((_, i) => selected[i]);
    if (toSave.length === 0) {
      toast.error("Selecione pelo menos um card");
      return;
    }

    setIsSaving(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Ensure "Plantão" deck exists
      const deckId = await ensurePlantaoDeck(supabase, user.id);
      if (!deckId) {
        toast.error("Erro ao criar deck Plantão");
        return;
      }

      // Insert flashcards
      const { error } = await supabase.from("flashcards").insert(
        toSave.map((card) => ({
          user_id: user.id,
          deck_id: deckId,
          front: card.front,
          back: card.back,
          source: "plantao-ai",
          tags: [topic.trim().toLowerCase()],
        })),
      );

      if (error) {
        toast.error("Erro ao salvar flashcards");
        return;
      }

      setSavedCount(toSave.length);
      setStep("done");
      router.refresh();
    } finally {
      setIsSaving(false);
    }
  }

  function toggleCard(index: number) {
    setSelected((prev) => prev.map((v, i) => (i === index ? !v : v)));
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Stethoscope className="h-5 w-5" />
            Vi no Plantão
          </DialogTitle>
        </DialogHeader>

        {step === "input" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="topic">
                O que você viu? Descreva o tema ou caso clínico
              </Label>
              <Input
                id="topic"
                placeholder="Ex: Manejo de cetoacidose diabética"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleGenerate();
                }}
              />
            </div>
            <Button
              onClick={handleGenerate}
              disabled={isGenerating || topic.trim().length < 3}
              className="w-full gap-2"
            >
              {isGenerating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              {isGenerating ? "Gerando..." : "Gerar Flashcards"}
            </Button>
          </div>
        )}

        {step === "preview" && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Selecione os cards que deseja salvar:
            </p>
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {cards.map((card, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 rounded-lg border p-3"
                >
                  <Checkbox
                    checked={selected[i]}
                    onCheckedChange={() => toggleCard(i)}
                    className="mt-0.5"
                  />
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px]">
                        {card.type === "cloze" ? "Cloze" : "Q&A"}
                      </Badge>
                    </div>
                    <p className="text-sm font-medium">{card.front}</p>
                    <p className="text-xs text-muted-foreground">
                      {card.back}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setStep("input")}
                className="flex-1"
              >
                Voltar
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving || selected.every((s) => !s)}
                className="flex-1 gap-2"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : null}
                Salvar {selected.filter(Boolean).length} cards
              </Button>
            </div>
          </div>
        )}

        {step === "done" && (
          <div className="flex flex-col items-center py-4 space-y-4">
            <CheckCircle2 className="h-12 w-12 text-green-500" />
            <div className="text-center">
              <p className="text-lg font-medium">
                {savedCount} cards salvos!
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Adicionados ao deck &ldquo;Plantão&rdquo; e prontos para
                revisão
              </p>
            </div>
            <Button onClick={() => handleClose(false)} className="w-full">
              Fechar
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

async function ensurePlantaoDeck(
  supabase: ReturnType<typeof createClient>,
  userId: string,
): Promise<string | null> {
  // Check if "Plantão" deck already exists
  const { data: existing } = await supabase
    .from("decks")
    .select("id")
    .eq("user_id", userId)
    .eq("title", "Plantão")
    .maybeSingle();

  if (existing) return existing.id;

  // Create it
  const { data: created, error } = await supabase
    .from("decks")
    .insert({
      user_id: userId,
      title: "Plantão",
      color: "#F5C49C",
      description: "Cards gerados a partir de casos clínicos do plantão",
    })
    .select("id")
    .single();

  if (error) return null;
  return created.id;
}
