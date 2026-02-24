import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar, MobileHeader } from "@/components/sidebar";
import { getNotifications } from "@/lib/notifications";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile?.onboarding_completed) redirect("/onboarding");

  const userData = {
    name: profile.full_name,
    email: profile.email,
    avatarUrl: profile.avatar_url,
  };

  const notifications = await getNotifications(supabase, user.id);

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <Sidebar user={userData} notifications={notifications} />
      <div className="flex-1 flex flex-col min-h-0">
        <MobileHeader user={userData} notifications={notifications} />
        <main className="flex-1 overflow-auto">
          <div className="mx-auto max-w-6xl p-4 sm:p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
