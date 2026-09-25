"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { validateFile, STUDENT_MAX_SIZE_BYTES, STUDENT_ALLOWED_TYPES } from "@/lib/file-validation";

export type SubmissionActionResult = { error: string } | { success: true };

export async function submitAssignment(
  assignmentId: string,
  formData: FormData
): Promise<SubmissionActionResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Giriş yapmalısın." };

  const note = (formData.get("note") as string) || null;
  const file = formData.get("file") as File | null;

  if (!file || file.size === 0) {
    return { error: "Lütfen teslim edeceğin dosyayı seç." };
  }

  const validation = validateFile(file, STUDENT_MAX_SIZE_BYTES, STUDENT_ALLOWED_TYPES, "10MB");
  if (!validation.valid) {
    return { error: validation.error! };
  }

  const { data: assignment } = await supabase
    .from("assignments")
    .select("due_at")
    .eq("id", assignmentId)
    .single<{ due_at: string }>();

  const isLate = assignment ? new Date() > new Date(assignment.due_at) : false;

  const adminSupabase = createAdminClient();
  const path = `${user.id}/${assignmentId}/${Date.now()}-${file.name}`;
  const { error: uploadError } = await adminSupabase.storage
    .from("submissions")
    .upload(path, file, { upsert: true });

  if (uploadError) {
    console.error("Dosya yüklenemedi:", uploadError);
    return { error: "Dosya yüklenemedi." };
  }

  const { error: updateError } = await supabase
    .from("submissions")
    .update({
      file_url: path,
      note,
      status: isLate ? "late" : "submitted",
      submitted_at: new Date().toISOString(),
    })
    .eq("assignment_id", assignmentId)
    .eq("student_id", user.id);

  if (updateError) {
    console.error("Teslim kaydedilemedi:", updateError);
    return { error: "Teslim kaydedilemedi." };
  }

  revalidatePath("/student/assignments");
  revalidatePath("/admin/assignments");
  return { success: true };
}