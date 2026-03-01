"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

const DECK_COLORS = [
  "#0047AB", "#6183D0", "#81C784", "#E5C287",
  "#E57373", "#64B5F6", "#CBBEE2", "#7EC8C8",
];

export function CreateDeckDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [color, setColor] = useState(DECK_COLORS[0]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase.from("decks").insert({
      user_id: user!.id,
      title: formData.get("title") as string,
      description: (formData.get("description") as string) || null,
      color,
    });

    if (error) {
      toast.error("Erro ao criar deck", { description: error.message });
      setIsLoading(false);
      return;
    }

    toast.success("Deck criado!");
    setOpen(false);
    setIsLoading(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Novo Deck
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Criar novo deck</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Nome do deck</Label>
            <Input
              id="title"
              name="title"
              placeholder="Ex: Cardiologia - ENARE"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Descrição (opcional)</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Sobre o que é este deck..."
              rows={2}
            />
          </div>
          <div className="space-y-2">
            <Label>Cor</Label>
            <div className="flex gap-2">
              {DECK_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className="h-8 w-8 rounded-full border-2 transition-transform"
                  style={{
                    backgroundColor: c,
                    borderColor: color === c ? "currentColor" : "transparent",
                    transform: color === c ? "scale(1.1)" : "scale(1)",
                  }}
                />
              ))}
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Criando..." : "Criar deck"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
