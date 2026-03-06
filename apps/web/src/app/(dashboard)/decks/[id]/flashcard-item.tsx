"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { MoreHorizontal, Trash2, EyeOff, Eye, Pencil } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import type { Flashcard } from "@dindin/shared";
import { EditFlashcardDialog } from "./edit-flashcard-dialog";

const FSRS_STATE: Record<number, { label: string; className: string }> = {
  0: {
    label: "Novo",
    className:
      "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  },
  1: {
    label: "Aprendendo",
    className:
      "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  },
  2: {
    label: "Revisão",
    className:
      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  },
  3: {
    label: "Reaprendendo",
    className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  },
};

interface FlashcardItemProps {
  flashcard: Flashcard;
  onDelete?: (cardId: string) => void;
  onToggleSuspend?: (cardId: string) => void;
  onEdit?: (updated: Flashcard) => void;
}

export function FlashcardItem({
  flashcard,
  onDelete,
  onToggleSuspend,
  onEdit,
}: FlashcardItemProps) {
  const [showBack, setShowBack] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const stateInfo = FSRS_STATE[flashcard.fsrs_state] ?? FSRS_STATE[0];

  async function handleDelete() {
    setIsDeleting(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("flashcards")
      .delete()
      .eq("id", flashcard.id);

    if (error) {
      toast.error("Erro ao deletar", { description: error.message });
      setIsDeleting(false);
      return;
    }

    toast.success("Flashcard deletado");
    setShowDeleteAlert(false);
    onDelete?.(flashcard.id);
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
    onToggleSuspend?.(flashcard.id);
  }

  return (
    <>
      <Card className={flashcard.is_suspended ? "opacity-60" : ""}>
        <CardContent className="flex items-start gap-3 py-4">
          {/* Content — click to reveal back */}
          <div
            className="flex-1 min-w-0 cursor-pointer select-none"
            onClick={() => setShowBack((v) => !v)}
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-medium leading-relaxed">{flashcard.front}</p>
              <span
                className={`shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${stateInfo.className}`}
              >
                {stateInfo.label}
              </span>
            </div>

            {showBack && (
              <p className="mt-2 text-sm text-muted-foreground border-t pt-2 leading-relaxed">
                {flashcard.back}
              </p>
            )}

            {showBack && flashcard.extra_context && (
              <p className="mt-1.5 text-xs text-muted-foreground/70 italic border-t pt-1.5">
                {flashcard.extra_context}
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

          {/* Actions menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setShowEditDialog(true)}>
                <Pencil className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleToggleSuspend}>
                {flashcard.is_suspended ? (
                  <>
                    <Eye className="mr-2 h-4 w-4" />
                    Reativar
                  </>
                ) : (
                  <>
                    <EyeOff className="mr-2 h-4 w-4" />
                    Pausar
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setShowDeleteAlert(true)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Deletar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardContent>
      </Card>

      <EditFlashcardDialog
        flashcard={flashcard}
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        onSaved={(updated) => {
          setShowEditDialog(false);
          onEdit?.(updated);
        }}
      />

      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deletar flashcard?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O histórico de revisões deste
              card também será removido.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deletando..." : "Deletar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
