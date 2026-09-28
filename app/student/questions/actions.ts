"use server";

import { randomUUID } from "node:crypto";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { STUDENT_ALLOWED_TYPES, STUDENT_MAX_SIZE_BYTES, validateFile } from "@/lib/file-validation";

export async function createQuestion(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  const title = ((formData.get("title") as string) || "").trim();
  const body = ((formData.get("body") as string) || "").trim();
  const attachment = formData.get("attachment");
  const file = attachment && typeof attachment !== "string" && attachment.size > 0 ? attachment : null;

  if (!title || (!body && !file)) return;
  if (file) {
    const validation = validateFile(file, STUDENT_MAX_SIZE_BYTES, STUDENT_ALLOWED_TYPES, "10MB");
    if (!validation.valid) return;
  }

  const adminSupabase = createAdminClient();

  const { data: question, error } = await supabase
    .from("questions")
    .insert({
      student_id: user.id,
      title,
      status: "open",
    })
    .select("id")
    .single<{ id: string }>();

  if (error || !question) return;

  let attachmentPath: string | null = null;
  if (file) {
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    attachmentPath = `${question.id}/${user.id}/${randomUUID()}-${safeName}`;
    const { error: uploadError } = await adminSupabase.storage
      .from("question-attachments")
      .upload(attachmentPath, file, { contentType: file.type, upsert: false });

    if (uploadError) {
      await adminSupabase.from("questions").delete().eq("id", question.id);
      return;
    }
  }

  const { error: messageError } = await supabase.from("question_messages").insert({
    question_id: question.id,
    sender_id: user.id,
    body: body || "Dosya eklendi.",
    attachment_url: attachmentPath,
  });

  if (messageError) {
    await adminSupabase.from("questions").delete().eq("id", question.id);
    if (attachmentPath) await adminSupabase.storage.from("question-attachments").remove([attachmentPath]);
    return;
  }

  const { data: admins } = await adminSupabase.from("profiles").select("id").eq("role", "admin").returns<{ id: string }[]>();

  if (admins?.length) {
    await adminSupabase.from("notifications").insert(
      admins.map((admin) => ({
        recipient_id: admin.id,
        channel: "in_app",
        title: "Yeni öğrenci sorusu",
        body: "Bir öğrenci Öğretmene Sor bölümünden yeni bir soru gönderdi.",
        link: "/admin/questions",
      }))
    );
  }

  revalidatePath("/student/questions");
  redirect(`/student/questions/${question.id}`);
}

export async function replyToQuestion(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  const questionId = formData.get("question_id");
  const body = ((formData.get("body") as string) || "").trim();
  const attachment = formData.get("attachment");
  const file = attachment && typeof attachment !== "string" && attachment.size > 0 ? attachment : null;
  if (typeof questionId !== "string" || !questionId || (!body && !file)) return;
  if (file) {
    const validation = validateFile(file, STUDENT_MAX_SIZE_BYTES, STUDENT_ALLOWED_TYPES, "10MB");
    if (!validation.valid) return;
  }

  const { data: question } = await supabase
    .from("questions")
    .select("student_id")
    .eq("id", questionId)
    .single<{ student_id: string }>();

  if (!question || question.student_id !== user.id) return;

  const adminSupabase = createAdminClient();
  let attachmentPath: string | null = null;
  if (file) {
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    attachmentPath = `${questionId}/${user.id}/${randomUUID()}-${safeName}`;
    const { error: uploadError } = await adminSupabase.storage
      .from("question-attachments")
      .upload(attachmentPath, file, { contentType: file.type, upsert: false });
    if (uploadError) return;
  }

  const { error } = await supabase.from("question_messages").insert({
    question_id: questionId,
    sender_id: user.id,
    body: body || "Dosya eklendi.",
    attachment_url: attachmentPath,
  });

  if (error) {
    if (attachmentPath) await adminSupabase.storage.from("question-attachments").remove([attachmentPath]);
    return;
  }

  await supabase
    .from("questions")
    .update({ status: "open", updated_at: new Date().toISOString() })
    .eq("id", questionId)
    .eq("student_id", user.id);

  const { data: admins } = await adminSupabase.from("profiles").select("id").eq("role", "admin").returns<{ id: string }[]>();

  if (admins?.length) {
    await adminSupabase.from("notifications").insert(
      admins.map((admin) => ({
        recipient_id: admin.id,
        channel: "in_app",
        title: "Yeni öğrenci mesajı",
        body: `Öğrenci yeni bir mesaj gönderdi: “${(body || "Dosya eki").slice(0, 80)}${body.length > 80 ? "..." : ""}”`,
        link: "/admin/questions",
      }))
    );
  }

  revalidatePath("/student/questions");
  revalidatePath(`/student/questions/${questionId}`);
  revalidatePath("/admin/questions");
}
