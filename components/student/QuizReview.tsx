import { CheckCircle2, XCircle } from "lucide-react";
import type { QuizOptionRow } from "@/lib/supabase/query-types";

interface ReviewQuestion {
  id: string;
  question_text: string;
  order_index: number;
  quiz_options: QuizOptionRow[];
}

export default function QuizReview({
  quizTitle,
  score,
  questions,
  myAnswers,
}: {
  quizTitle: string;
  score: number | null;
  questions: ReviewQuestion[];
  myAnswers: { question_id: string; selected_option_id: string | null }[];
}) {
  const answerMap = new Map(myAnswers.map((a) => [a.question_id, a.selected_option_id]));

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">{quizTitle}</h1>
      <div className="card mt-4 bg-brand-50 text-center">
        <p className="text-sm text-slate-600">Sonucun</p>
        <p className="text-3xl font-bold text-brand-700">{score ?? 0}/100</p>
      </div>

      <div className="mt-6 space-y-4">
        {questions.map((q, i) => {
          const mySelectedId = answerMap.get(q.id);
          return (
            <div key={q.id} className="card">
              <p className="font-medium text-slate-900">
                {i + 1}. {q.question_text}
              </p>
              <div className="mt-3 space-y-2">
                {q.quiz_options.map((opt) => {
                  const isMine = mySelectedId === opt.id;
                  const isCorrect = opt.is_correct;
                  let className = "border-slate-200";
                  if (isCorrect) className = "border-green-400 bg-green-50";
                  else if (isMine && !isCorrect) className = "border-red-400 bg-red-50";
                  return (
                    <div
                      key={opt.id}
                      className={`flex items-center gap-2 rounded-lg border p-2.5 text-sm ${className}`}
                    >
                      {isCorrect && <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-green-600" />}
                      {isMine && !isCorrect && <XCircle className="h-4 w-4 flex-shrink-0 text-red-600" />}
                      {opt.option_text}
                      {isMine && <span className="ml-auto text-xs text-slate-400">Senin cevabın</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}