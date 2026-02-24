import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return new Response("Não autorizado", { status: 401 });
  }

  const { deckId } = (await req.json()) as { deckId: string };

  // Fetch public deck + its flashcards
  const { data: sourceDeck } = await supabase
    .from("decks")
    .select("title, description, color, specialty_id, banca_id, clone_count")
    .eq("id", deckId)
    .eq("is_public", true)
    .single();

  if (!sourceDeck) {
    return NextResponse.json({ error: "Deck não encontrado ou não é público" }, { status: 404 });
  }

  const { data: sourceCards } = await supabase
    .from("flashcards")
    .select("front, back, extra_context, tags, specialty_id, banca_id")
    .eq("deck_id", deckId);

  // Create new deck for user
  const { data: newDeck, error: deckError } = await supabase
    .from("decks")
    .insert({
      user_id: user.id,
      title: `${sourceDeck.title} (cópia)`,
      description: sourceDeck.description,
      color: sourceDeck.color,
      specialty_id: sourceDeck.specialty_id,
      banca_id: sourceDeck.banca_id,
    })
    .select("id")
    .single();

  if (deckError || !newDeck) {
    return NextResponse.json({ error: "Erro ao criar deck" }, { status: 500 });
  }

  // Clone flashcards
  if (sourceCards && sourceCards.length > 0) {
    const cardsToInsert = sourceCards.map((card) => ({
      user_id: user.id,
      deck_id: newDeck.id,
      front: card.front,
      back: card.back,
      extra_context: card.extra_context,
      tags: card.tags,
      specialty_id: card.specialty_id,
      banca_id: card.banca_id,
      source: "manual" as const,
    }));

    await supabase.from("flashcards").insert(cardsToInsert);
  }

  // Increment clone count on source (best-effort)
  await supabase
    .from("decks")
    .update({ clone_count: (sourceDeck.clone_count ?? 0) + 1 })
    .eq("id", deckId);

  return NextResponse.json({ deck_id: newDeck.id });
}
