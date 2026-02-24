"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Trash2, EyeOff, Eye } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import type { Flashcard } from "@dindin/shared";

interface FlashcardItemProps {
  flashcard: Flashcard;
}

export function FlashcardItem({ flashcard }: FlashcardItemProps) {
  const router = useRouter();
  const [showBack, setShowBack] = useState(false);

  async function handleDelete() {
    const supabase = createClient();
    const { error } = await supabase
      .from("flashcards")
      .delete()
      .eq("id", flashcard.id);

    if (error) {
      toast.error("Erro ao deletar", { description: error.message });
      return;
    }

    toast.success("Flashcard deletado");
    router.refresh();
  }

  async function handleToggleSuspend() {
    const supabase = createClient();
    const { error } = await supabase
      .from("flashcards")
      .update({ is_suspended: !flashcard.is_suspended })
      .eq("id", flashcard.id);

    if (error) {
      toast.error("Erro", { description: error.message });
      return;
    }

    toast.success(flashcard.is_suspended ? "Card reativado" : "Card pausado");
    router.refresh();
  }

  return (
    <Card className={flashcard.is_suspended ? "opacity-60" : ""}>
      <CardContent className="flex items-start gap-4 py-4">
        <div
          className="flex-1 min-w-0 cursor-pointer"
          onClick={() => setShowBack(!showBack)}
        >
          <p className="text-sm font-medium">{flashcard.front}</p>
          {showBack && (
            <p className="mt-2 text-sm text-muted-foreground border-t pt-2">
              {flashcard.back}
            </p>
          )}
          {flashcard.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {flashcard.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="shrink-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleToggleSuspend}>
              {flashcard.is_suspended ? (
                <><Eye className="mr-2 h-4 w-4" /> Reativar</>
              ) : (
                <><EyeOff className="mr-2 h-4 w-4" /> Pausar</>
              )}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleDelete} className="text-destructive">
              <Trash2 className="mr-2 h-4 w-4" /> Deletar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardContent>
    </Card>
  );
}
