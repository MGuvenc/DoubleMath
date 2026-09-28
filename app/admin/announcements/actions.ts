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

  const { data: announcement, error } = await supabase
    .from("announcements")
    .insert({
      title,
      body,
      created_by: user.id,
      send_email: false,
    })
    .select("id")
    .single<{ id: string }>();

  if (!error && announcement) {
    const { data: students } = await supabase
      .from("profiles")
      .select("id")
      .eq("role", "student")
      .eq("is_active", true)
      .returns<{ id: string }[]>();

    if (students?.length) {
      await supabase.from("notifications").insert(
        students.map((student) => ({
          recipient_id: student.id,
          channel: "in_app",
          title: "Yeni duyuru",
          body: `${title} — ${body.slice(0, 120)}${body.length > 120 ? "..." : ""}`,
          link: "/student/announcements",
        }))
      );
    }

    revalidatePath("/admin/announcements");
    revalidatePath("/student/announcements");
  }
}
