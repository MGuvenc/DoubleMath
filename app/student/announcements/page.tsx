import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { Bell, CheckCircle2 } from "lucide-react";

export async function markAnnouncementAsRead(formData: FormData) {
  "use server";

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const announcementId = formData.get("announcement_id");
  if (!user || typeof announcementId !== "string" || !announcementId) return;

  const { error } = await supabase.from("announcement_reads").upsert({
    announcement_id: announcementId,
    student_id: user.id,
  });

  if (!error) {
    revalidatePath("/student/announcements");
  }
}

export default async function StudentAnnouncementsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: memberships } = await supabase
    .from("student_group_members")
    .select("group_id")
    .eq("student_id", user.id);

  const groupIds = (memberships || []).map((member) => member.group_id);

  let announcementsQuery = supabase.from("announcements").select("*");

  if (groupIds.length === 0) {
    announcementsQuery = announcementsQuery.is("target_group_id", null);
  } else {
    announcementsQuery = announcementsQuery.or(
      `target_group_id.is.null,target_group_id.in.(${groupIds.join(",")})`
    );
  }

  const { data: announcements } = await announcementsQuery.order("created_at", { ascending: false });

  const { data: readRecords } = await supabase
    .from("announcement_reads")
    .select("announcement_id")
    .eq("student_id", user.id);

  const readIds = new Set((readRecords || []).map((record) => record.announcement_id));

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Duyurular</h1>
      <p className="mt-1 text-sm text-slate-500">Öğretmeninden ve ekibinden gelen önemli güncellemeleri gör.</p>

      <div className="mt-6 space-y-4">
        {(announcements || []).length === 0 && (
          <div className="card text-center text-sm text-slate-400">Henüz yayınlanmış bir duyuru yok.</div>
        )}

        {(announcements || []).map((announcement) => {
          const isRead = readIds.has(announcement.id);

          return (
            <div key={announcement.id} className="card">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-brand-50 p-2 text-brand-600">
                    <Bell className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-slate-900">{announcement.title}</h2>
                    <p className="mt-1 text-xs text-slate-500">
                      {new Date(announcement.created_at).toLocaleString("tr-TR", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </p>
                  </div>
                </div>

                <span
                  className={
                    isRead
                      ? "inline-flex rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700"
                      : "inline-flex rounded-full bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700"
                  }
                >
                  {isRead ? "Okundu" : "Yeni"}
                </span>
              </div>

              <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-slate-600">{announcement.body}</p>

              {!isRead && (
                <form action={markAnnouncementAsRead} className="mt-4">
                  <input type="hidden" name="announcement_id" value={announcement.id} />
                  <button type="submit" className="inline-flex items-center gap-2 text-sm font-medium text-brand-700 hover:underline">
                    <CheckCircle2 className="h-4 w-4" />
                    Okundu olarak işaretle
                  </button>
                </form>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
