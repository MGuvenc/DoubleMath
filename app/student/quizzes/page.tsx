import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { ClipboardCheck } from "lucide-react";
import type { QuizRow, QuizAttemptRow } from "@/lib/supabase/query-types";

export default async function StudentQuizzesPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: quizzes } = await supabase
    .from("quizzes")
    .select("*")
    .eq("is_published", true)
    .order("created_at", { ascending: false })
    .returns<QuizRow[]>();

  const { data: attempts } = await supabase
    .from("quiz_attempts")
    .select("*")
    .eq("student_id", user!.id)
    .returns<QuizAttemptRow[]>();

  const attemptByQuiz = new Map((attempts || []).map((a) => [a.quiz_id, a]));

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Sınavlar</h1>
      <div className="mt-6 space-y-3">
        {(quizzes || []).length === 0 && (
          <div className="card text-center text-sm text-slate-400">Şu an aktif bir sınav yok.</div>
        )}
        {(quizzes || []).map((q) => {
          const attempt = attemptByQuiz.get(q.id);
          return (
            <Link
              key={q.id}
              href={`/student/quizzes/${q.id}`}
              className="card flex items-center justify-between hover:border-brand-300"
            >
              <div className="flex items-center gap-3">
                <ClipboardCheck className="h-5 w-5 text-brand-600" />
                <div>
                  <p className="font-medium text-slate-900">{q.title}</p>
                  <p className="text-xs text-slate-400">
                    {q.time_limit_minutes ? `${q.time_limit_minutes} dakika` : "Süresiz"}
                  </p>
                </div>
              </div>
              {attempt?.submitted_at ? (
                <span className="rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700">
                  Tamamlandı — {attempt.score}/100
                </span>
              ) : attempt ? (
                <span className="rounded-full bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700">
                  Devam Ediyor
                </span>
              ) : (
                <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                  Başlamadı
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}