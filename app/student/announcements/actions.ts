"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function markAnnouncementAsRead(formData: FormData) {
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
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("recipient_id", user.id)
      .eq("link", `/student/announcements?id=${announcementId}`)
      .eq("is_read", false);

    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("recipient_id", user.id)
      .eq("link", "/student/announcements")
      .eq("is_read", false);

    revalidatePath("/student/announcements");
    revalidatePath("/student");
  }
}
