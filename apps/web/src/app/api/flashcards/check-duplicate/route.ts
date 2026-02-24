import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("Authorization");
  const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

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

  const front = req.nextUrl.searchParams.get("front");
  if (!front || front.trim().length < 5) {
    return NextResponse.json({ duplicate: null }, { headers: CORS_HEADERS });
  }

  // Extract meaningful keywords (words with 4+ chars)
  const keywords = front
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length >= 4)
    .slice(0, 4);

  if (keywords.length === 0) {
    return NextResponse.json({ duplicate: null }, { headers: CORS_HEADERS });
  }

  // Build ilike filter for each keyword
  const filters = keywords.map((kw) => `front.ilike.%${kw}%`).join(",");

  const { data } = await supabase
    .from("flashcards")
    .select("id, front, back")
    .eq("user_id", userId)
    .or(filters)
    .limit(1)
    .maybeSingle();

  return NextResponse.json({ duplicate: data ?? null }, { headers: CORS_HEADERS });
}
