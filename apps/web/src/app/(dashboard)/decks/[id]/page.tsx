import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient, getUser } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";
import { getPlanLimits, getUsageCount, checkFlashcardLimit } from "@/lib/plan-limits";
import { DeckDetailClient } from "./deck-detail-client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data: deck } = await supabase
    .from("decks")
    .select("title")
    .eq("id", id)
    .single();

  return { title: deck?.title ?? "Deck" };
}

export default async function DeckDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const user = await getUser();

  const { data: deck } = await supabase
    .from("decks")
    .select("*")
    .eq("id", id)
    .eq("user_id", user!.id)
    .single();

  if (!deck) notFound();

  const [flashcardsResult, limits, usage] = await Promise.all([
    supabase
      .from("flashcards")
      .select("*")
      .eq("deck_id", id)
      .order("created_at", { ascending: false }),
    getPlanLimits(supabase, user!.id),
    getUsageCount(supabase, user!.id),
  ]);

  const flashcards = flashcardsResult.data;
  const fcLimit = checkFlashcardLimit(limits, usage);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/decks">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: deck.color }}
            />
            <h1 className="text-2xl font-bold">{deck.title}</h1>
          </div>
          {deck.description && (
            <p className="text-muted-foreground ml-14">{deck.description}</p>
          )}
        </div>
        <Badge variant="secondary">
          {deck.card_count} {deck.card_count === 1 ? "card" : "cards"}
        </Badge>
      </div>

      <DeckDetailClient
        deckId={deck.id}
        initialFlashcards={flashcards ?? []}
        limitReached={!fcLimit.allowed}
        limitInfo={fcLimit.limit !== null ? `${fcLimit.current}/${fcLimit.limit} este mês (${fcLimit.plan_name})` : undefined}
      />
    </div>
  );
}
