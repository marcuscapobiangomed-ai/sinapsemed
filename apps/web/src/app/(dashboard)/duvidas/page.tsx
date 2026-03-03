import { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient, getUser } from "@/lib/supabase/server";
import { BANCA_DISPLAY_NAMES } from "@/lib/ai";
import { ChatClient } from "./chat-client";

export const metadata: Metadata = {
  title: "Dúvidas",
};

export default async function DuvidasPage() {
  const supabase = await createClient();
  const user = await getUser();

  if (!user) redirect("/login");

  // Fetch doubts used today and plan limits in parallel
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [doubtsResult, subResult, bancasResult] = await Promise.all([
    supabase
      .from("doubt_logs")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("created_at", todayStart.toISOString()),
    supabase
      .from("subscriptions")
      .select("plans(max_doubts_per_day)")
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle(),
    supabase
      .from("user_bancas")
      .select("bancas(slug)")
      .eq("user_id", user.id),
  ]);

  const doubtsUsed = doubtsResult.count ?? 0;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const maxDoubts = (subResult.data as any)?.plans?.max_doubts_per_day ?? 5;

  const userBancas = (bancasResult.data ?? [])
    .map((ub) => {
      const slug = (ub.bancas as unknown as { slug: string } | null)?.slug;
      return slug ? (BANCA_DISPLAY_NAMES[slug] ?? slug.toUpperCase()) : null;
    })
    .filter((s): s is string => !!s);

  return (
    <ChatClient
      doubtsUsed={doubtsUsed}
      maxDoubts={maxDoubts}
      userBancas={userBancas}
    />
  );
}
