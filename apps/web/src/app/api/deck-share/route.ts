import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return new Response("Não autorizado", { status: 401 });
  }

  const { deckId, isPublic } = (await req.json()) as {
    deckId: string;
    isPublic: boolean;
  };

  // Verify ownership
  const { data: deck } = await supabase
    .from("decks")
    .select("id, share_code")
    .eq("id", deckId)
    .eq("user_id", user.id)
    .single();

  if (!deck) {
    return NextResponse.json({ error: "Deck não encontrado" }, { status: 404 });
  }

  const shareCode = isPublic && !deck.share_code
    ? crypto.randomBytes(6).toString("hex")
    : deck.share_code;

  const { error } = await supabase
    .from("decks")
    .update({ is_public: isPublic, share_code: shareCode })
    .eq("id", deckId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ is_public: isPublic, share_code: shareCode });
}
