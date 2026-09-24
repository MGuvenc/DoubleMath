"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type QuizAttemptResult = { error: string } | { success: true; attemptId: string };
export type SaveAnswerResult = { error: string } | { success: true };
export type FinishAttemptResult = { error: string } | { success: true; score: number };

export async function startQuizAttempt(quizId: string): Promise<QuizAttemptResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Giriş yapmalısın." };

  const { data: quiz } = await supabase
    .from("quizzes")
    .select("id, time_limit_minutes")
    .eq("id", quizId)
    .single<{ id: string; time_limit_minutes: number | null }>();

  if (!quiz) return { error: "Bu sınava erişimin yok." };

  const { data: existing } = await supabase
    .from("quiz_attempts")
    .select("id")
    .eq("quiz_id", quizId)
    .eq("student_id", user.id)
    .maybeSingle<{ id: string }>();

  if (existing) return { success: true, attemptId: existing.id };

  const { data: attempt, error } = await supabase
    .from("quiz_attempts")
    .insert({ quiz_id: quizId, student_id: user.id, time_limit_minutes: quiz.time_limit_minutes })
    .select("id")
    .single<{ id: string }>();

  if (error || !attempt) {
    console.error("Deneme başlatılamadı:", error);
    return { error: "Sınav başlatılamadı." };
  }

  revalidatePath(`/student/quizzes/${quizId}`);
  return { success: true, attemptId: attempt.id };
}

export async function saveAnswer(
  attemptId: string,
  questionId: string,
  optionId: string
): Promise<SaveAnswerResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Giriş yapmalısın." };

  const { data: attempt } = await supabase
    .from("quiz_attempts")
    .select("student_id, started_at, time_limit_minutes, submitted_at")
    .eq("id", attemptId)
    .single<{
      student_id: string;
      started_at: string;
      time_limit_minutes: number | null;
      submitted_at: string | null;
    }>();

  if (!attempt || attempt.student_id !== user.id) return { error: "Yetkin yok." };
  if (attempt.submitted_at) return { error: "Sınav zaten tamamlandı." };
  if (attempt.time_limit_minutes) {
    const deadline = new Date(attempt.started_at).getTime() + attempt.time_limit_minutes * 60000;
    if (Date.now() > deadline) return { error: "Süre doldu." };
  }

  const { error } = await supabase
    .from("quiz_attempt_answers")
    .upsert(
      { attempt_id: attemptId, question_id: questionId, selected_option_id: optionId },
      { onConflict: "attempt_id,question_id" }
    );

  if (error) {
    console.error("Cevap kaydedilemedi:", error);
    return { error: "Cevap kaydedilemedi." };
  }
  return { success: true };
}

export async function finishAttempt(attemptId: string): Promise<FinishAttemptResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Giriş yapmalısın." };

  const { data: attempt } = await supabase
    .from("quiz_attempts")
    .select("id, quiz_id, student_id, submitted_at")
    .eq("id", attemptId)
    .single<{ id: string; quiz_id: string; student_id: string; submitted_at: string | null }>();

  if (!attempt || attempt.student_id !== user.id) return { error: "Bu deneme sana ait değil." };
  if (attempt.submitted_at) return { error: "Bu sınav zaten tamamlanmış." };

  const adminSupabase = createAdminClient();

  const { data: questions } = await adminSupabase
    .from("quiz_questions")
    .select("id, quiz_options(id, is_correct)")
    .eq("quiz_id", attempt.quiz_id)
    .returns<{ id: string; quiz_options: { id: string; is_correct: boolean }[] }[]>();

  const { data: answers } = await supabase
    .from("quiz_attempt_answers")
    .select("question_id, selected_option_id")
    .eq("attempt_id", attemptId)
    .returns<{ question_id: string; selected_option_id: string | null }[]>();

  const totalQuestions = questions?.length || 0;
  let correctCount = 0;

  for (const q of questions || []) {
    const answer = answers?.find((a) => a.question_id === q.id);
    const correctOption = q.quiz_options.find((o) => o.is_correct);
    if (answer?.selected_option_id && correctOption && answer.selected_option_id === correctOption.id) {
      correctCount++;
    }
  }

  const score = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 10000) / 100 : 0;

  const { error: updateError } = await supabase
    .from("quiz_attempts")
    .update({ submitted_at: new Date().toISOString(), score })
    .eq("id", attemptId);

  if (updateError) {
    console.error("Sınav sonuçlandırılamadı:", updateError);
    return { error: "Sınav sonuçlandırılamadı." };
  }

  revalidatePath("/student/quizzes");
  revalidatePath(`/student/quizzes/${attempt.quiz_id}`);
  revalidatePath(`/admin/quizzes/${attempt.quiz_id}`);
  return { success: true, score };
}