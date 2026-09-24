import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import QuizEditor from "@/components/admin/QuizEditor";
import type { QuizRow, QuizQuestionRow, QuizAttemptWithStudentRow } from "@/lib/supabase/query-types";

export default async function AdminQuizDetailPage({ params }: { params: { quizId: string } }) {
  const supabase = createClient();

  const { data: quiz } = await supabase
    .from("quizzes")
    .select("*")
    .eq("id", params.quizId)
    .single<QuizRow>();

  if (!quiz) notFound();

  const { data: questions } = await supabase
    .from("quiz_questions")
    .select("*, quiz_options(*)")
    .eq("quiz_id", params.quizId)
    .order("order_index", { ascending: true })
    .order("order_index", { ascending: true, foreignTable: "quiz_options" })
    .returns<QuizQuestionRow[]>();

  const { data: attempts } = await supabase
    .from("quiz_attempts")
    .select("*, profiles(full_name, email)")
    .eq("quiz_id", params.quizId)
    .order("submitted_at", { ascending: false })
    .returns<QuizAttemptWithStudentRow[]>();

  return <QuizEditor quiz={quiz} questions={questions || []} attempts={attempts || []} />;
}