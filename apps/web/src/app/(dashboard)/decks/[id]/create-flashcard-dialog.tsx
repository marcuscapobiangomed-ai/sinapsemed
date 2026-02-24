"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Lock } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

interface CreateFlashcardDialogProps {
  deckId: string;
  limitReached?: boolean;
  limitInfo?: string;
}

export function CreateFlashcardDialog({ deckId, limitReached, limitInfo }: CreateFlashcardDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const tagsRaw = (formData.get("tags") as string).trim();
    const tags = tagsRaw ? tagsRaw.split(",").map((t) => t.trim()).filter(Boolean) : [];

    const { error } = await supabase.from("flashcards").insert({
      user_id: user!.id,
      deck_id: deckId,
      front: formData.get("front") as string,
      back: formData.get("back") as string,
      extra_context: (formData.get("extra_context") as string) || null,
      tags,
      source: "manual",
    });

    if (error) {
      toast.error("Erro ao criar flashcard", { description: error.message });
      setIsLoading(false);
      return;
    }

    toast.success("Flashcard criado!");
    setOpen(false);
    setIsLoading(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button disabled={limitReached}>
          {limitReached ? (
            <Lock className="mr-2 h-4 w-4" />
          ) : (
            <Plus className="mr-2 h-4 w-4" />
          )}
          {limitReached ? "Limite atingido" : "Novo Card"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Criar flashcard</DialogTitle>
        </DialogHeader>
        {limitInfo && (
          <p className="text-xs text-muted-foreground">
            Flashcards criados: {limitInfo}
          </p>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="front">
              Frente (pergunta)
            </Label>
            <Textarea
              id="front"
              name="front"
              placeholder="Qual o mecanismo de ação dos IECA?"
              required
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              Dica: Mantenha a pergunta simples. Resposta ideal em &lt; 8 segundos.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="back">
              Verso (resposta)
            </Label>
            <Textarea
              id="back"
              name="back"
              placeholder="Inibem a Enzima Conversora de Angiotensina, reduzindo a conversão de Angiotensina I em II."
              required
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="extra_context">
              Contexto extra (opcional)
            </Label>
            <Textarea
              id="extra_context"
              name="extra_context"
              placeholder="Mostrado após responder. Ex: referência, página do livro, etc."
              rows={2}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tags">Tags (opcional)</Label>
            <Input
              id="tags"
              name="tags"
              placeholder="farmacologia, anti-hipertensivos, IECA"
            />
            <p className="text-xs text-muted-foreground">
              Separe as tags por vírgula
            </p>
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Criando..." : "Criar flashcard"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
