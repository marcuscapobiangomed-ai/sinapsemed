import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import {
  dbToFSRSCard,
  fsrsCardToDBFields,
  scheduleReview,
  ratingStringToEnum,
} from "@/lib/fsrs";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(req: NextRequest) {
  // Support both cookie auth (web app) and Bearer token (extension)
  const authHeader = req.headers.get("Authorization");
  const bearerToken = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7)
    : null;

  let userId: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let supabase: any;

  if (bearerToken) {
    supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: `Bearer ${bearerToken}` } } },
    );
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: CORS_HEADERS });
    }
    userId = user.id;
  } else {
    supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: CORS_HEADERS });
    }
    userId = user.id;
  }

  const body = await req.json() as { flashcard_id: string; rating: string };
  const { flashcard_id, rating } = body;

  if (!flashcard_id || !rating) {
    return NextResponse.json(
      { error: "flashcard_id e rating são obrigatórios" },
      { status: 400, headers: CORS_HEADERS },
    );
  }

  // Fetch the flashcard
  const { data: card, error: fetchError } = await supabase
    .from("flashcards")
    .select(
      "id, fsrs_stability, fsrs_difficulty, fsrs_elapsed_days, fsrs_scheduled_days, fsrs_reps, fsrs_lapses, fsrs_state, fsrs_last_review",
    )
    .eq("id", flashcard_id)
    .eq("user_id", userId)
    .single();

  if (fetchError || !card) {
    return NextResponse.json(
      { error: "Flashcard não encontrado" },
      { status: 404, headers: CORS_HEADERS },
    );
  }

  // Run FSRS scheduling
  const fsrsCard = dbToFSRSCard(card);
  const ratingEnum = ratingStringToEnum(rating);
  const result = scheduleReview(fsrsCard, ratingEnum);
  const updatedFields = fsrsCardToDBFields(result.card);

  // Update flashcard
  const { error: updateError } = await supabase
    .from("flashcards")
    .update(updatedFields)
    .eq("id", flashcard_id);

  if (updateError) {
    return NextResponse.json(
      { error: "Erro ao atualizar flashcard" },
      { status: 500, headers: CORS_HEADERS },
    );
  }

  // Save review log
  await supabase.from("reviews").insert({
    user_id: userId,
    flashcard_id,
    rating,
    fsrs_stability_before: card.fsrs_stability,
    fsrs_difficulty_before: card.fsrs_difficulty,
    fsrs_state_before: card.fsrs_state,
  });

  return NextResponse.json(
    {
      next_review_at: updatedFields.next_review_at,
      fsrs_state: updatedFields.fsrs_state,
    },
    { headers: CORS_HEADERS },
  );
}
