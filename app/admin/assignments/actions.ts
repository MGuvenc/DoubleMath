"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type AssignmentActionResult = { error: string } | { success: true };

function toIsoWithTurkeyOffset(date: string, time: string) {
  return new Date(`${date}T${time}:00+03:00`).toISOString();
}

export async function createAssignment(formData: FormData): Promise<AssignmentActionResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Giriş yapmalısın." };

  const title = formData.get("title") as string;
  const description = (formData.get("description") as string) || null;
  const dueDate = formData.get("due_date") as string;
  const dueTime = (formData.get("due_time") as string) || "23:59";
  const targetMode = formData.get("target_mode") as string; // "all" | "specific"
  const studentIds = formData.getAll("student_ids") as string[];
  const file = formData.get("attachment") as File | null;

  if (!title || !dueDate) {
    return { error: "Başlık ve son tarih zorunludur." };
  }

  const dueAt = toIsoWithTurkeyOffset(dueDate, dueTime);

  const { data: assignment, error: insertError } = await supabase
    .from("assignments")
    .insert({ title, description, due_at: dueAt, created_by: user.id })
    .select("id")
    .single<{ id: string }>();

  if (insertError || !assignment) {
    console.error("Ödev oluşturulamadı:", insertError);
    return { error: `Ödev oluşturulamadı: ${insertError?.message || "bilinmeyen hata"}` };
  }

  const adminSupabase = createAdminClient();

  // Dosya varsa yükle ve ödev satırına bağla
  if (file && file.size > 0) {
    const path = `${Date.now()}-${file.name}`;
    const { error: uploadError } = await adminSupabase.storage
      .from("assignments")
      .upload(path, file, { upsert: true });

    if (uploadError) {
      console.error("Dosya yüklenemedi:", uploadError);
      return { error: "Ödev oluşturuldu ama dosya yüklenemedi." };
    }
    await supabase.from("assignments").update({ attachment_url: path }).eq("id", assignment.id);
  }

  // Hedef öğrencileri belirle
  let targetStudentIds: string[] = studentIds;
  if (targetMode === "all") {
    const { data: allStudents } = await supabase
      .from("profiles")
      .select("id")
      .eq("role", "student")
      .eq("is_active", true)
      .returns<{ id: string }[]>();
    targetStudentIds = (allStudents || []).map((s) => s.id);
  }

  if (targetStudentIds.length === 0) {
    return { error: "Ödev oluşturuldu ama en az bir öğrenci hedeflenmedi." };
  }

  await supabase.from("assignment_targets").insert(
    targetStudentIds.map((sid) => ({ assignment_id: assignment.id, student_id: sid }))
  );

  await adminSupabase.from("submissions").insert(
    targetStudentIds.map((sid) => ({
      assignment_id: assignment.id,
      student_id: sid,
      status: "pending" as const,
    }))
  );

  await supabase.from("notifications").insert(
    targetStudentIds.map((sid) => ({
      recipient_id: sid,
      channel: "in_app" as const,
      title: "Yeni Ödev",
      body: `"${title}" adlı yeni bir ödev verildi. Son tarih: ${new Date(dueAt).toLocaleDateString("tr-TR")}`,
      link: "/student/assignments",
    }))
  );

  revalidatePath("/admin/assignments");
  revalidatePath("/student/assignments");
  return { success: true };
}

export async function gradeSubmission(
  submissionId: string,
  grade: number | null,
  feedback: string
): Promise<AssignmentActionResult> {
  const supabase = createClient();

  const { error } = await supabase
    .from("submissions")
    .update({
      grade,
      feedback: feedback || null,
      status: "graded",
      graded_at: new Date().toISOString(),
    })
    .eq("id", submissionId);

  if (error) {
    console.error("Not verilemedi:", error);
    return { error: "Not verilemedi." };
  }

  revalidatePath("/admin/assignments");
  revalidatePath("/student/assignments");
  return { success: true };
}