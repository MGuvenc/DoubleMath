"use server";

import { randomUUID } from "node:crypto";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { STUDENT_ALLOWED_TYPES, STUDENT_MAX_SIZE_BYTES, validateFile } from "@/lib/file-validation";

export async function sendQuestionReply(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const questionId = formData.get("question_id");
  const body = ((formData.get("body") as string) || "").trim();
  const attachment = formData.get("attachment");
  const file = attachment && typeof attachment !== "string" && attachment.size > 0 ? attachment : null;

  if (typeof questionId !== "string" || !questionId) return;
  if (!body && !file) redirect(`/admin/questions/${questionId}?error=message-required`);
  if (file) {
    const validation = validateFile(file, STUDENT_MAX_SIZE_BYTES, STUDENT_ALLOWED_TYPES, "10MB");
    if (!validation.valid) redirect(`/admin/questions/${questionId}?error=invalid-file`);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single<{ role: string }>();
  if (profile?.role !== "admin") return;

  const { data: question } = await supabase
    .from("questions")
    .select("student_id")
    .eq("id", questionId)
    .single<{ student_id: string }>();

  if (!question) return;

  const adminSupabase = createAdminClient();
  let attachmentPath: string | null = null;
  if (file) {
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    attachmentPath = `${questionId}/${user.id}/${randomUUID()}-${safeName}`;
    const { error: uploadError } = await adminSupabase.storage
      .from("submissions")
      .upload(attachmentPath, file, { contentType: file.type, upsert: false });

    if (uploadError) {
      console.error("Öğretmen mesaj eki yüklenemedi:", uploadError);
      redirect(`/admin/questions/${questionId}?error=upload-failed`);
    }
  }

  const { error } = await supabase.from("question_messages").insert({
    question_id: questionId,
    sender_id: user.id,
    body: body || "Dosya eklendi.",
    attachment_url: attachmentPath,
  });

  if (error) {
    console.error("Öğretmen mesajı kaydedilemedi:", error);
    if (attachmentPath) await adminSupabase.storage.from("submissions").remove([attachmentPath]);
    redirect(`/admin/questions/${questionId}?error=message-save`);
  }

  await supabase
    .from("questions")
    .update({ status: "open", updated_at: new Date().toISOString() })
    .eq("id", questionId);

  await supabase.from("notifications").insert({
    recipient_id: question.student_id,
    channel: "in_app",
    title: "Öğretmenden cevap geldi",
    body: "Öğretmenin sorunu cevapladı. Mesajı görmek için Öğretmene Sor sayfasına bak.",
    link: `/student/questions?question_id=${questionId}`,
  });

  revalidatePath("/admin/questions");
  revalidatePath(`/admin/questions/${questionId}`);
  revalidatePath("/student/questions");
  redirect(`/admin/questions/${questionId}`);
}
