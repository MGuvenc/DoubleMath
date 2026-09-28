"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function markNotificationAsRead(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  const notificationId = formData.get("notification_id");
  if (typeof notificationId !== "string" || !notificationId) return;

  await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", notificationId)
    .eq("recipient_id", user.id);

  revalidatePath("/admin/notifications");
  revalidatePath("/admin/dashboard");
}
