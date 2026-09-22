"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

function toIsoWithTurkeyOffset(date: string, time: string) {
  return new Date(`${date}T${time}:00+03:00`).toISOString();
}

export type LessonActionResult = { error: string } | { success: true };

export async function createLesson(formData: FormData): Promise<LessonActionResult> {
  const supabase = createClient();

  const studentId = formData.get("student_id") as string;
  const date = formData.get("date") as string;
  const startTime = formData.get("start_time") as string;
  const endTime = formData.get("end_time") as string;
  const topic = (formData.get("topic") as string) || null;
  const meetingUrl = (formData.get("meeting_url") as string) || null;

  if (!studentId || !date || !startTime || !endTime) {
    return { error: "Öğrenci, tarih, başlangıç ve bitiş saati zorunludur." };
  }

  const startsAt = toIsoWithTurkeyOffset(date, startTime);
  const endsAt = toIsoWithTurkeyOffset(date, endTime);

  if (new Date(endsAt) <= new Date(startsAt)) {
    return { error: "Bitiş saati başlangıç saatinden sonra olmalıdır." };
  }

  const { error } = await supabase.from("lessons").insert({
    student_id: studentId,
    starts_at: startsAt,
    ends_at: endsAt,
    topic,
    meeting_url: meetingUrl,
    status: "scheduled",
  });

  if (error) {
    console.error("Ders oluşturulamadı:", error);
    return { error: "Ders oluşturulamadı. Yetkin olmayabilir ya da bir hata oluştu." };
  }

  revalidatePath("/admin/lessons");
  revalidatePath("/student/dashboard");
  revalidatePath("/student/lessons");
  return { success: true };
}

export async function updateLesson(lessonId: string, formData: FormData): Promise<LessonActionResult> {
  const supabase = createClient();

  const date = formData.get("date") as string;
  const startTime = formData.get("start_time") as string;
  const endTime = formData.get("end_time") as string;
  const topic = (formData.get("topic") as string) || null;
  const meetingUrl = (formData.get("meeting_url") as string) || null;

  if (!date || !startTime || !endTime) {
    return { error: "Tarih, başlangıç ve bitiş saati zorunludur." };
  }

  const startsAt = toIsoWithTurkeyOffset(date, startTime);
  const endsAt = toIsoWithTurkeyOffset(date, endTime);

  if (new Date(endsAt) <= new Date(startsAt)) {
    return { error: "Bitiş saati başlangıç saatinden sonra olmalıdır." };
  }

    const { error } = await supabase
        .from("lessons")
        .update({
        starts_at: startsAt,
        ends_at: endsAt,
        topic,
        meeting_url: meetingUrl,
        status: "scheduled",
        reschedule_reason: null,
        reminder_24h_sent: false,
        reminder_1h_sent: false,
        })
        .eq("id", lessonId);

    if (error) {
        console.error("Ders güncellenemedi:", error);
        return { error: "Ders güncellenemedi." };
    }

    revalidatePath("/admin/lessons");
    revalidatePath("/student/dashboard");
    revalidatePath("/student/lessons");
    return { success: true };
    }

export async function cancelLesson(lessonId: string): Promise<LessonActionResult> {
  const supabase = createClient();

  const { error } = await supabase
    .from("lessons")
    .update({ status: "cancelled" })
    .eq("id", lessonId);

  if (error) {
    console.error("Ders iptal edilemedi:", error);
    return { error: "Ders iptal edilemedi." };
  }

  revalidatePath("/admin/lessons");
  revalidatePath("/student/dashboard");
  revalidatePath("/student/lessons");
  return { success: true };
}

export async function markLessonCompleted(lessonId: string, teacherNotes: string): Promise<LessonActionResult> {
  const supabase = createClient();

  const { error } = await supabase
    .from("lessons")
    .update({ status: "completed", teacher_notes: teacherNotes || null })
    .eq("id", lessonId);

  if (error) {
    console.error("Ders tamamlandı olarak işaretlenemedi:", error);
    return { error: "İşlem başarısız oldu." };
  }

  revalidatePath("/admin/lessons");
  return { success: true };
}

export async function dismissRescheduleRequest(lessonId: string): Promise<LessonActionResult> {
  const supabase = createClient();

  // Erteleme talebini reddet: ders orijinal saatinde kalır, sadece durumu ve
  // sebep metni temizlenir.
  const { error } = await supabase
    .from("lessons")
    .update({ status: "scheduled", reschedule_reason: null })
    .eq("id", lessonId);

  if (error) {
    console.error("Erteleme talebi reddedilemedi:", error);
    return { error: "İşlem başarısız oldu." };
  }

  revalidatePath("/admin/lessons");
  revalidatePath("/student/lessons");
  return { success: true };
}