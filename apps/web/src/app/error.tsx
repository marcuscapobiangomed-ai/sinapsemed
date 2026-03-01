"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Unhandled error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 mb-6">
        <AlertTriangle className="h-7 w-7 text-destructive" />
      </div>
      <h1 className="text-2xl font-bold tracking-tight">
        Algo deu errado
      </h1>
      <p className="mt-2 text-sm text-muted-foreground max-w-md">
        Ocorreu um erro inesperado. Tente novamente ou volte mais tarde.
      </p>
      {error.digest && (
        <p className="mt-2 text-xs text-muted-foreground font-mono">
          Ref: {error.digest}
        </p>
      )}
      <Button onClick={reset} className="mt-8">
        Tentar novamente
      </Button>
    </div>
  );
}
