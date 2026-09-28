import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AdminSidebar from "@/components/admin/AdminSidebar";
import type { ProfileRoleRow } from "@/lib/supabase/query-types";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .single<ProfileRoleRow>();

  if (profile?.role !== "admin") redirect("/student/dashboard");

  const { data: unreadNotifications } = await supabase
    .from("notifications")
    .select("link")
    .eq("recipient_id", user.id)
    .eq("is_read", false);

  const unreadCounts = (unreadNotifications || []).reduce<Record<string, number>>((counts, notification) => {
    if (notification.link) {
      const href = notification.link.split("?")[0];
      counts[href] = (counts[href] || 0) + 1;
    }
    return counts;
  }, {});

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 sm:flex-row">
      <AdminSidebar adminName={profile.full_name} unreadCounts={unreadCounts} />
      <main className="flex-1 p-4 sm:p-8">{children}</main>
    </div>
  );
}