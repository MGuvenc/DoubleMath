"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/require-admin";
import { revalidatePath } from "next/cache";

export type TopicProgressActionResult = { error: string } | { success: true };

export async function addTopicProgress(formData: FormData): Promise<TopicProgressActionResult> {
  const guard = await requireAdmin();
  if (!guard.ok) return { error: guard.error };

  const studentId = ((formData.get("student_id") as string) || "").trim();
  const topic = ((formData.get("topic") as string) || "").trim();
  const masteryLevel = Number(formData.get("mastery_level"));
  const comment = ((formData.get("comment") as string) || "").trim() || null;

  if (!studentId || !topic || topic.length > 120) {
    return { error: "Öğrenci seç ve en fazla 120 karakterlik bir konu adı gir." };
  }
  if (!Number.isInteger(masteryLevel) || masteryLevel < 0 || masteryLevel > 100) {
    return { error: "Seviye 0 ile 100 arasında tam sayı olmalı." };
  }
  if (comment && comment.length > 2000) return { error: "Öğretmen notu en fazla 2000 karakter olabilir." };

  const supabase = createAdminClient();
  const { data: student } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", studentId)
    .maybeSingle<{ id: string; role: string }>();

  if (student?.role !== "student") return { error: "Seçilen öğrenci bulunamadı." };

  const { error } = await supabase.from("topics_progress").insert({
    student_id: studentId,
    topic,
    mastery_level: masteryLevel,
    comment,
  });

  if (error) {
    console.error("Konu ilerlemesi kaydedilemedi:", error);
    return { error: "İlerleme kaydedilemedi." };
  }

  const { error: notificationError } = await supabase.from("notifications").insert({
    recipient_id: studentId,
    channel: "in_app",
    title: "İlerlemen güncellendi",
    body: `${topic} konusu için yeni değerlendirmen eklendi.`,
    link: "/student/progress",
  });
  if (notificationError) console.error("İlerleme bildirimi gönderilemedi:", notificationError);

  revalidatePath("/admin/progress");
  revalidatePath("/student/progress");
  return { success: true };
}