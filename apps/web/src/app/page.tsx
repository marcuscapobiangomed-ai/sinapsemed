import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight">
          SinapseMED
        </h1>
        <p className="mt-3 text-lg text-muted-foreground">
          Estudo inteligente para residência médica
        </p>
        <div className="mt-8 flex gap-4 justify-center">
          <Button asChild>
            <Link href="/login">Entrar</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/register">Criar conta</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
