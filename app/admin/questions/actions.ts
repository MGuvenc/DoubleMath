"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateQuestionStatus(formData: FormData) {
  const supabase = createClient();
  const questionId = formData.get("question_id");
  const status = formData.get("status");

  if (typeof questionId !== "string" || !questionId) return;
  if (status !== "open" && status !== "answered" && status !== "closed") return;

  const { error } = await supabase
    .from("questions")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", questionId);

  if (!error) {
    revalidatePath("/admin/questions");
  }
}

export async function sendQuestionReply(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  const questionId = formData.get("question_id");
  const body = ((formData.get("body") as string) || "").trim();

  if (typeof questionId !== "string" || !questionId || !body) return;

  const { data: question } = await supabase
    .from("questions")
    .select("student_id")
    .eq("id", questionId)
    .single<{ student_id: string }>();

  if (!question) return;

  const { error } = await supabase.from("question_messages").insert({
    question_id: questionId,
    sender_id: user.id,
    body,
  });

  if (error) return;

  await supabase
    .from("questions")
    .update({ status: "answered", updated_at: new Date().toISOString() })
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
}
