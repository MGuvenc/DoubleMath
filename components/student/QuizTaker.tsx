"use client";

import { useState, useEffect, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import { saveAnswer, finishAttempt } from "@/app/student/quizzes/actions";
import type { QuizQuestionForStudent } from "@/lib/supabase/query-types";

export default function QuizTaker({
  quizTitle,
  attemptId,
  startedAt,
  timeLimitMinutes,
  questions,
  initialAnswers,
}: {
  quizTitle: string;
  attemptId: string;
  startedAt: string;
  timeLimitMinutes: number | null;
  questions: QuizQuestionForStudent[];
  initialAnswers: { question_id: string; selected_option_id: string | null }[];
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [isFinishing, setIsFinishing] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>(
    Object.fromEntries(
      initialAnswers
        .filter((a) => a.selected_option_id)
        .map((a) => [a.question_id, a.selected_option_id as string])
    )
  );
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const [finished, setFinished] = useState(false);

  const handleFinish = useCallback(() => {
    if (finished) return;
    setFinished(true);
    setIsFinishing(true);
    startTransition(async () => {
      await finishAttempt(attemptId);
      router.refresh();
    });
  }, [attemptId, finished, router]);

  useEffect(() => {
    if (!timeLimitMinutes) return;
    const deadline = new Date(startedAt).getTime() + timeLimitMinutes * 60000;

    function tick() {
      const secondsLeft = Math.max(0, Math.round((deadline - Date.now()) / 1000));
      setRemainingSeconds(secondsLeft);
      if (secondsLeft <= 0) {
        handleFinish();
      }
    }

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [startedAt, timeLimitMinutes, handleFinish]);

  function handleSelect(questionId: string, optionId: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
    startTransition(async () => {
      await saveAnswer(attemptId, questionId, optionId);
    });
  }

  const answeredCount = Object.keys(answers).length;

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">{quizTitle}</h1>
        {remainingSeconds !== null && (
          <div
            className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${
              remainingSeconds < 60 ? "bg-red-50 text-red-700" : "bg-brand-50 text-brand-700"
            }`}
          >
            {Math.floor(remainingSeconds / 60)}:{String(remainingSeconds % 60).padStart(2, "0")}
          </div>
        )}
      </div>
      <p className="mt-1 text-sm text-slate-500">
        {answeredCount}/{questions.length} soru cevaplandı
      </p>

      <div className="mt-6 space-y-4">
        {questions.map((q, i) => (
          <div key={q.id} className="card">
            <p className="font-medium text-slate-900">
              {i + 1}. {q.question_text}
            </p>
            <div className="mt-3 space-y-2">
              {q.quiz_options.map((opt) => (
                <label
                  key={opt.id}
                  className={`flex cursor-pointer items-center gap-2 rounded-lg border p-2.5 text-sm ${
                    answers[q.id] === opt.id
                      ? "border-brand-500 bg-brand-50"
                      : "border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <input
                    type="radio"
                    name={`q-${q.id}`}
                    checked={answers[q.id] === opt.id}
                    onChange={() => handleSelect(q.id, opt.id)}
                  />
                  {opt.option_text}
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      <button onClick={handleFinish} disabled={isFinishing || finished} className="btn-primary mt-6">
        {isFinishing ? "Gönderiliyor..." : "Sınavı Bitir"}
      </button>
    </div>
  );
}