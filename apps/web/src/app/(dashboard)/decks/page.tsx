import { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Layers } from "lucide-react";
import { CreateDeckDialog } from "./create-deck-dialog";

export const metadata: Metadata = {
  title: "Decks",
};

export default async function DecksPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: decks } = await supabase
    .from("decks")
    .select("*")
    .eq("user_id", user!.id)
    .eq("is_archived", false)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Meus Decks</h1>
          <p className="text-muted-foreground">
            Organize seus flashcards por tema
          </p>
        </div>
        <CreateDeckDialog />
      </div>

      {!decks || decks.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Layers className="h-12 w-12 text-muted-foreground/50" />
            <p className="mt-4 text-lg font-medium">Nenhum deck criado</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Crie seu primeiro deck para começar a adicionar flashcards
            </p>
            <div className="mt-6">
              <CreateDeckDialog />
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {decks.map((deck) => (
            <Link key={deck.id} href={`/decks/${deck.id}`}>
              <Card className="transition-shadow hover:shadow-md cursor-pointer h-full">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="h-3 w-3 rounded-full shrink-0"
                      style={{ backgroundColor: deck.color }}
                    />
                    <CardTitle className="text-base truncate">
                      {deck.title}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  {deck.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      {deck.description}
                    </p>
                  )}
                  <Badge variant="secondary">
                    {deck.card_count} {deck.card_count === 1 ? "card" : "cards"}
                  </Badge>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
