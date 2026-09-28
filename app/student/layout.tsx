import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import StudentSidebar from "@/components/student/StudentSidebar";
import type { ProfileFullRow } from "@/lib/supabase/query-types";

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single<ProfileFullRow>();

  const { count } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("recipient_id", user.id)
    .eq("is_read", false);

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 sm:flex-row">
      <StudentSidebar studentName={profile?.full_name || ""} unreadCount={count ?? 0} />
      <main className="flex-1 p-4 pb-8 sm:p-8">{children}</main>
    </div>
  );
}