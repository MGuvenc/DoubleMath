import { createClient, createAdminClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import StartQuizButton from "@/components/student/StartQuizButton";
import QuizTaker from "@/components/student/QuizTaker";
import QuizReview from "@/components/student/QuizReview";
import type {
  QuizRow,
  QuizAttemptRow,
  QuizQuestionForStudent,
  QuizOptionRow,
} from "@/lib/supabase/query-types";

export default async function StudentQuizPage({ params }: { params: { quizId: string } }) {
  const supabase = createClient();
  const adminSupabase = createAdminClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: quiz } = await supabase
    .from("quizzes")
    .select("*")
    .eq("id", params.quizId)
    .single<QuizRow>();

  if (!quiz) notFound();

  const { data: attempt } = await supabase
    .from("quiz_attempts")
    .select("*")
    .eq("quiz_id", params.quizId)
    .eq("student_id", user!.id)
    .maybeSingle<QuizAttemptRow>();

  const { count: questionCount } = await adminSupabase
    .from("quiz_questions")
    .select("id", { count: "exact", head: true })
    .eq("quiz_id", params.quizId);

  if (!attempt) {
    return (
      <div className="card mx-auto max-w-lg text-center">
        <h1 className="text-xl font-bold text-slate-900">{quiz.title}</h1>
        {quiz.description && <p className="mt-2 text-sm text-slate-600">{quiz.description}</p>}
        <p className="mt-4 text-sm text-slate-500">
          {questionCount || 0} soru —{" "}
          {quiz.time_limit_minutes ? `${quiz.time_limit_minutes} dakika süre` : "süre sınırı yok"}
        </p>
        {(quiz.available_from || quiz.available_until) && (
          <p className="mt-1 text-sm text-slate-500">
            {quiz.available_from &&
              `Başlangıç: ${new Date(quiz.available_from).toLocaleString("tr-TR", {
                timeZone: "Europe/Istanbul",
              })}`}
            {quiz.available_from && quiz.available_until && " — "}
            {quiz.available_until &&
              `Bitiş: ${new Date(quiz.available_until).toLocaleString("tr-TR", {
                timeZone: "Europe/Istanbul",
              })}`}
          </p>
        )}
        <p className="mt-2 text-xs text-amber-600">
          Sınava başladıktan sonra geri dönemezsin, tek deneme hakkın var.
        </p>
        <StartQuizButton quizId={quiz.id} />
      </div>
    );
  }

  if (!attempt.submitted_at) {
    const { data: questions } = await adminSupabase
      .from("quiz_questions")
      .select("id, quiz_id, question_text, order_index, quiz_options(id, question_id, option_text, order_index)")
      .eq("quiz_id", params.quizId)
      .order("order_index", { ascending: true })
      .order("order_index", { ascending: true, foreignTable: "quiz_options" })
      .returns<QuizQuestionForStudent[]>();

    const { data: existingAnswers } = await supabase
      .from("quiz_attempt_answers")
      .select("question_id, selected_option_id")
      .eq("attempt_id", attempt.id)
      .returns<{ question_id: string; selected_option_id: string | null }[]>();

    return (
      <QuizTaker
        quizTitle={quiz.title}
        attemptId={attempt.id}
        startedAt={attempt.started_at}
        timeLimitMinutes={attempt.time_limit_minutes}
        questions={questions || []}
        initialAnswers={existingAnswers || []}
      />
    );
  }

  const { data: reviewQuestions } = await adminSupabase
    .from("quiz_questions")
    .select(
      "id, quiz_id, question_text, order_index, quiz_options(id, question_id, option_text, is_correct, order_index)"
    )
    .eq("quiz_id", params.quizId)
    .order("order_index", { ascending: true })
    .order("order_index", { ascending: true, foreignTable: "quiz_options" })
    .returns<(QuizQuestionForStudent & { quiz_options: QuizOptionRow[] })[]>();

  const { data: myAnswers } = await supabase
    .from("quiz_attempt_answers")
    .select("question_id, selected_option_id")
    .eq("attempt_id", attempt.id)
    .returns<{ question_id: string; selected_option_id: string | null }[]>();

  // Sınav bitince cevapları göster
  let canReveal = true;
  let revealAt: string | null = null;
  if (quiz.available_until) {
    const reveal = new Date(
      new Date(quiz.available_until).getTime() + (quiz.time_limit_minutes || 0) * 60000
    );
    revealAt = reveal.toISOString();
    canReveal = new Date() >= reveal;
  }

  return (
    <QuizReview
      quizTitle={quiz.title}
      score={attempt.score}
      questions={reviewQuestions || []}
      myAnswers={myAnswers || []}
      canReveal={canReveal}
      revealAt={revealAt}
    />
  );
}