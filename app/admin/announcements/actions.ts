"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createAnnouncement(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  const title = ((formData.get("title") as string) || "").trim();
  const body = ((formData.get("body") as string) || "").trim();

  if (!title || !body) return;

  const { error } = await supabase.from("announcements").insert({
    title,
    body,
    created_by: user.id,
    send_email: false,
  });

  if (!error) {
    revalidatePath("/admin/announcements");
  }
}
