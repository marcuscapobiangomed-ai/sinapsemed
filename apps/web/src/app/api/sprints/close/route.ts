import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getGapAnalysis } from "@/lib/gap-queries";

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { sprint_id } = (await req.json()) as { sprint_id: string };
  if (!sprint_id) {
    return NextResponse.json(
      { error: "sprint_id required" },
      { status: 400 },
    );
  }

  // Verify sprint belongs to user and is active
  const { data: sprint } = await supabase
    .from("sprints")
    .select("*")
    .eq("id", sprint_id)
    .eq("user_id", user.id)
    .single();

  if (!sprint) {
    return NextResponse.json({ error: "Sprint not found" }, { status: 404 });
  }

  if (sprint.current_phase === "completed") {
    return NextResponse.json(
      { error: "Sprint already completed" },
      { status: 409 },
    );
  }

  // Run gap analysis for end-of-sprint diagnostic
  const gapAnalysis = await getGapAnalysis(supabase, user.id);

  // Update sprint to closing phase with diagnostic_end
  await supabase
    .from("sprints")
    .update({
      current_phase: "closing",
      diagnostic_end: gapAnalysis,
    })
    .eq("id", sprint_id);

  return NextResponse.json({ success: true });
}
