"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[dashboard] Error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/10 mb-4">
        <AlertTriangle className="h-6 w-6 text-destructive" />
      </div>
      <h2 className="text-xl font-bold">Erro ao carregar a pagina</h2>
      <p className="mt-2 text-sm text-muted-foreground max-w-sm">
        Ocorreu um erro inesperado. Tente novamente.
      </p>
      {error.digest && (
        <p className="mt-1 text-xs text-muted-foreground font-mono">
          Ref: {error.digest}
        </p>
      )}
      <Button onClick={reset} className="mt-6 gap-2">
        <RotateCcw className="h-4 w-4" />
        Tentar novamente
      </Button>
    </div>
  );
}
