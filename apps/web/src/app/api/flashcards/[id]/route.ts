import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { front, back, extra_context, tags } = body;

  if (!front?.trim() || !back?.trim()) {
    return NextResponse.json(
      { error: "front e back são obrigatórios" },
      { status: 400 },
    );
  }

  const parsedTags = Array.isArray(tags)
    ? tags.map((t: string) => String(t).trim()).filter(Boolean).slice(0, 10)
    : [];

  // RLS protects ownership — .eq("user_id") is defense-in-depth
  const { data: card, error } = await supabase
    .from("flashcards")
    .update({
      front: front.trim().slice(0, 1000),
      back: back.trim().slice(0, 1000),
      extra_context: extra_context?.trim().slice(0, 2000) || null,
      tags: parsedTags,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ card });
}
