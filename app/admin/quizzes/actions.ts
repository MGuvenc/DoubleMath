"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type QuizActionResult = { error: string } | { success: true };
export type QuizActionResultWithId = { error: string } | { success: true; id: string };

export async function createQuiz(formData: FormData): Promise<QuizActionResultWithId> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Giriş yapmalısın." };

  const title = formData.get("title") as string;
  const description = (formData.get("description") as string) || null;
  const timeLimitRaw = formData.get("time_limit_minutes") as string;
  const timeLimit = timeLimitRaw ? Number(timeLimitRaw) : null;

  if (!title) return { error: "Başlık zorunludur." };

  const { data, error } = await supabase
    .from("quizzes")
    .insert({ title, description, time_limit_minutes: timeLimit, created_by: user.id })
    .select("id")
    .single<{ id: string }>();

  if (error || !data) {
    console.error("Sınav oluşturulamadı:", error);
    return { error: `Sınav oluşturulamadı: ${error?.message || "bilinmeyen hata"}` };
  }

  revalidatePath("/admin/quizzes");
  return { success: true, id: data.id };
}

export async function addQuestion(quizId: string, formData: FormData): Promise<QuizActionResult> {
  const supabase = createClient();

  const questionText = formData.get("question_text") as string;
  const correctIndex = Number(formData.get("correct_option") as string);
  const optionTexts = [0, 1, 2, 3]
    .map((i) => (formData.get(`option_${i}`) as string) || "")
    .filter((t) => t.trim() !== "");

  if (!questionText || optionTexts.length < 2) {
    return { error: "Soru metni ve en az 2 seçenek girmelisin." };
  }

  const { data: question, error: qError } = await supabase
    .from("quiz_questions")
    .insert({ quiz_id: quizId, question_text: questionText, order_index: Date.now() })
    .select("id")
    .single<{ id: string }>();

  if (qError || !question) {
    console.error("Soru eklenemedi:", qError);
    return { error: "Soru eklenemedi. Yetkin olmayabilir." };
  }

  const { error: oError } = await supabase.from("quiz_options").insert(
    optionTexts.map((text, i) => ({
      question_id: question.id,
      option_text: text,
      is_correct: i === correctIndex,
      order_index: i,
    }))
  );

  if (oError) {
    console.error("Seçenekler eklenemedi:", oError);
    return { error: "Seçenekler eklenemedi." };
  }

  revalidatePath(`/admin/quizzes/${quizId}`);
  return { success: true };
}

export async function deleteQuestion(quizId: string, questionId: string): Promise<QuizActionResult> {
  const supabase = createClient();
  const { error } = await supabase.from("quiz_questions").delete().eq("id", questionId);
  if (error) return { error: "Soru silinemedi." };
  revalidatePath(`/admin/quizzes/${quizId}`);
  return { success: true };
}

export async function togglePublish(quizId: string, publish: boolean): Promise<QuizActionResult> {
  const supabase = createClient();
  const { error } = await supabase.from("quizzes").update({ is_published: publish }).eq("id", quizId);
  if (error) return { error: "Durum güncellenemedi." };
  revalidatePath(`/admin/quizzes/${quizId}`);
  revalidatePath("/admin/quizzes");
  revalidatePath("/student/quizzes");
  return { success: true };
}

export async function deleteQuiz(quizId: string): Promise<QuizActionResult> {
  const supabase = createClient();
  const { error } = await supabase.from("quizzes").delete().eq("id", quizId);
  if (error) return { error: "Sınav silinemedi." };
  revalidatePath("/admin/quizzes");
  return { success: true };
}