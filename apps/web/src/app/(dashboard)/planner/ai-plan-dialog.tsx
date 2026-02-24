"use client";

import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface AIPlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  weekStart: string;
  onGenerated: () => void;
}

export function AIPlanDialog({
  open,
  onOpenChange,
  weekStart,
  onGenerated,
}: AIPlanDialogProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [strategy, setStrategy] = useState<string | null>(null);

  async function handleGenerate() {
    setIsGenerating(true);
    setStrategy(null);
    try {
      const res = await fetch("/api/planner/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ week_start: weekStart }),
      });

      const data = (await res.json()) as { message?: string; count?: number; error?: string; strategy?: string };

      if (!res.ok) {
        toast.error(data.error ?? "Erro ao gerar plano");
        return;
      }

      if (data.count === 0) {
        toast.info("Nenhum bloco novo foi adicionado");
      } else {
        toast.success(`${data.count} blocos adicionados ao plano`);
        if (data.strategy) setStrategy(data.strategy);
      }

      // Small delay so user can see strategy before closing
      setTimeout(() => onGenerated(), data.strategy ? 2500 : 300);
    } catch {
      toast.error("Erro ao conectar com o servidor");
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            Gerar plano com IA
          </DialogTitle>
          <DialogDescription>
            A IA vai analisar seus cards pendentes, lacunas de conhecimento e
            os pesos da banca para criar um plano de estudo otimizado para
            esta semana.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 mt-2">
          <div className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
            <p>Blocos existentes serão mantidos. Apenas novos blocos serão adicionados.</p>
          </div>

          {strategy && (
            <div className="rounded-lg bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 p-3 text-sm">
              <p className="font-medium text-purple-700 dark:text-purple-300 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" />
                Estrategia da IA
              </p>
              <p className="mt-1 text-purple-600 dark:text-purple-400">{strategy}</p>
            </div>
          )}

          <Button
            className="w-full"
            onClick={handleGenerate}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Gerando plano...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Gerar plano da semana
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
