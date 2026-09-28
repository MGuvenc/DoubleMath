"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createQuestion(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  const title = ((formData.get("title") as string) || "").trim();
  if (!title) return;

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

  const { data: admins } = await supabase.from("profiles").select("id").eq("role", "admin").returns<{ id: string }[]>();

  if (admins?.length) {
    await supabase.from("notifications").insert(
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
}

export async function replyToQuestion(formData: FormData) {
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

  const { data: admins } = await supabase.from("profiles").select("id").eq("role", "admin").returns<{ id: string }[]>();

  if (admins?.length) {
    await supabase.from("notifications").insert(
      admins.map((admin) => ({
        recipient_id: admin.id,
        channel: "in_app",
        title: "Yeni öğrenci mesajı",
        body: `Öğrenci, “${body.slice(0, 80)}${body.length > 80 ? "..." : ""}” mesajını gönderdi.`,
        link: "/admin/questions",
      }))
    );
  }

  revalidatePath("/student/questions");
  revalidatePath("/admin/questions");
}
