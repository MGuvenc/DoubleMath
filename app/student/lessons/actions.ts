"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type RescheduleActionResult = { error: string } | { success: true };

interface LessonOwnershipCheck {
  id: string;
  student_id: string;
  status: string;
}

export async function requestReschedule(
  lessonId: string,
  reason: string
): Promise<RescheduleActionResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Giriş yapmalısın." };
  if (!reason || reason.trim().length < 5) {
    return { error: "Lütfen erteleme sebebini kısaca yaz (en az 5 karakter)." };
  }

  const { data: lesson, error: fetchError } = await supabase
    .from("lessons")
    .select("id, student_id, status")
    .eq("id", lessonId)
    .single<LessonOwnershipCheck>();

  if (fetchError || !lesson) return { error: "Ders bulunamadı." };
  if (lesson.student_id !== user.id) return { error: "Bu derse erişim yetkin yok." };
  if (lesson.status !== "scheduled") {
    return { error: "Sadece planlanmış dersler için erteleme talep edilebilir." };
  }

  const adminSupabase = createAdminClient();
  const { error: updateError } = await adminSupabase
    .from("lessons")
    .update({ status: "reschedule_requested", reschedule_reason: reason.trim() })
    .eq("id", lessonId);

  if (updateError) {
    console.error("Erteleme talebi kaydedilemedi:", updateError);
    return { error: "Talebin kaydedilemedi, tekrar dene." };
  }

  // Admin bildirimi
  const { data: studentProfile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single<{ full_name: string }>();

  const { data: admins } = await adminSupabase
    .from("profiles")
    .select("id")
    .eq("role", "admin")
    .returns<{ id: string }[]>();

  if (admins?.length) {
    await adminSupabase.from("notifications").insert(
      admins.map((admin) => ({
        recipient_id: admin.id,
        channel: "in_app" as const,
        title: "Yeni Erteleme Talebi",
        body: `${studentProfile?.full_name || "Bir öğrenci"} bir ders için erteleme talep etti.`,
        link: "/admin/lessons",
      }))
    );
  }

  revalidatePath("/student/lessons");
  revalidatePath("/admin/lessons");
  return { success: true };
}