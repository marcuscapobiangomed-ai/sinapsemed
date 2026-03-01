import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Brain } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 mb-6">
        <Brain className="h-7 w-7 text-primary" />
      </div>
      <h1 className="text-4xl font-bold tracking-tight">404</h1>
      <p className="mt-2 text-lg text-muted-foreground">
        Essa pagina nao foi encontrada.
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        O link pode estar incorreto ou a pagina foi removida.
      </p>
      <Button asChild className="mt-8">
        <Link href="/">Voltar ao inicio</Link>
      </Button>
    </div>
  );
}
