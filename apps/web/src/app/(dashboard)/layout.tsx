import { redirect } from "next/navigation";
import { createClient, getUser } from "@/lib/supabase/server";
import { Sidebar, MobileHeader } from "@/components/sidebar";
import { getNotifications } from "@/lib/notifications";
import { OnboardingTour } from "@/components/onboarding-tour";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Uses cached getUser() — deduplicates with page-level calls
  const user = await getUser();
  if (!user) redirect("/login");

  const supabase = await createClient();

  // Run profile + notifications in parallel
  const [{ data: profile }, notifications] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name, email, avatar_url, onboarding_completed, onboarding_tour_completed")
      .eq("id", user.id)
      .single(),
    getNotifications(supabase, user.id),
  ]);

  if (!profile?.onboarding_completed) redirect("/onboarding");

  const userData = {
    name: profile.full_name,
    email: profile.email,
    avatarUrl: profile.avatar_url,
  };

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <OnboardingTour userId={user.id} showTour={!profile.onboarding_tour_completed} />
      <Sidebar user={userData} notifications={notifications} />
      <div className="flex-1 flex flex-col min-h-0">
        <MobileHeader user={userData} notifications={notifications} />
        <main className="flex-1 overflow-auto">
          <div className="mx-auto max-w-6xl p-5 sm:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
