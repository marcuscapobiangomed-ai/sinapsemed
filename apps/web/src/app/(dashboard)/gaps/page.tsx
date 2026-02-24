import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getGapAnalysis } from "@/lib/gap-queries";
import { GapsDashboard } from "./gaps-dashboard";

export const metadata: Metadata = {
  title: "Lacunas de Conhecimento",
};

export default async function GapsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = user!.id;

  const data = await getGapAnalysis(supabase, userId);

  return <GapsDashboard data={data} />;
}
