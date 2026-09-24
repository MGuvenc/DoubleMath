"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Plus, Trash2, CheckCircle2 } from "lucide-react";
import { addQuestion, deleteQuestion, togglePublish, deleteQuiz } from "@/app/admin/quizzes/actions";
import type { QuizRow, QuizQuestionRow, QuizAttemptWithStudentRow } from "@/lib/supabase/query-types";

export default function QuizEditor({
  quiz,
  questions,
  attempts,
}: {
  quiz: QuizRow;
  questions: QuizQuestionRow[];
  attempts: QuizAttemptWithStudentRow[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [correctIndex, setCorrectIndex] = useState(0);

  function handleAddQuestion(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    const form = e.currentTarget;

    startTransition(async () => {
      const result = await addQuestion(quiz.id, formData);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      form.reset();
      setCorrectIndex(0);
      router.refresh();
    });
  }

  function handleDeleteQuestion(questionId: string) {
    if (!confirm("Bu soruyu silmek istediğine emin misin?")) return;
    startTransition(async () => {
      await deleteQuestion(quiz.id, questionId);
      router.refresh();
    });
  }

  function handleTogglePublish() {
    startTransition(async () => {
      await togglePublish(quiz.id, !quiz.is_published);
      router.refresh();
    });
  }

  function handleDeleteQuiz() {
    if (!confirm("Bu sınavı tamamen silmek istediğine emin misin? Tüm sorular ve sonuçlar silinecek.")) return;
    startTransition(async () => {
      await deleteQuiz(quiz.id);
      router.push("/admin/quizzes");
    });
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{quiz.title}</h1>
          {quiz.description && <p className="mt-1 text-sm text-slate-600">{quiz.description}</p>}
          <p className="mt-1 text-sm text-slate-500">
            {quiz.time_limit_minutes ? `${quiz.time_limit_minutes} dakika süreli` : "Süresiz"} —{" "}
            {questions.length} soru
          </p>
        </div>
        <div className="flex flex-shrink-0 gap-2">
          <button
            onClick={handleTogglePublish}
            disabled={isPending}
            className={quiz.is_published ? "btn-secondary" : "btn-primary"}
          >
            {quiz.is_published ? "Yayından Kaldır" : "Yayınla"}
          </button>
          <button onClick={handleDeleteQuiz} className="btn-secondary text-red-600">
            Sınavı Sil
          </button>
        </div>
      </div>

      {quiz.is_published && questions.length === 0 && (
        <p className="mt-3 text-sm text-amber-600">
          Bu sınav yayında ama hiç sorusu yok — öğrenciler boş bir sınav görecek.
        </p>
      )}

      <div className="mt-8">
        <h2 className="text-lg font-semibold text-slate-900">Sorular</h2>
        <div className="mt-3 space-y-3">
          {questions.map((q, qIndex) => (
            <div key={q.id} className="card">
              <div className="flex items-start justify-between gap-2">
                <p className="font-medium text-slate-900">
                  {qIndex + 1}. {q.question_text}
                </p>
                <button onClick={() => handleDeleteQuestion(q.id)} title="Soruyu Sil" className="flex-shrink-0">
                  <Trash2 className="h-4 w-4 text-slate-400 hover:text-red-600" />
                </button>
              </div>
              <ul className="mt-3 space-y-1.5">
                {q.quiz_options.map((opt) => (
                  <li
                    key={opt.id}
                    className={`flex items-center gap-2 text-sm ${
                      opt.is_correct ? "font-medium text-green-700" : "text-slate-600"
                    }`}
                  >
                    {opt.is_correct && <CheckCircle2 className="h-4 w-4" />}
                    {opt.option_text}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <form onSubmit={handleAddQuestion} className="card mt-4">
          <h3 className="font-medium text-slate-900">Yeni Soru Ekle</h3>
          <div className="mt-3">
            <label className="label">Soru Metni *</label>
            <textarea name="question_text" required rows={2} className="input" />
          </div>
          <div className="mt-3 space-y-2">
            <label className="label">Seçenekler (doğru olanı işaretle)</label>
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="radio"
                  name="correct_option"
                  value={i}
                  checked={correctIndex === i}
                  onChange={() => setCorrectIndex(i)}
                />
                <input
                  type="text"
                  name={`option_${i}`}
                  required={i < 2}
                  placeholder={`Seçenek ${i + 1}${i < 2 ? " *" : " (opsiyonel)"}`}
                  className="input"
                />
              </div>
            ))}
          </div>
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={isPending} className="btn-primary mt-4 inline-flex items-center gap-2">
            <Plus className="h-4 w-4" /> {isPending ? "Ekleniyor..." : "Soruyu Ekle"}
          </button>
        </form>
      </div>

      <div className="mt-10">
        <h2 className="text-lg font-semibold text-slate-900">Sonuçlar</h2>
        <div className="card mt-3 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="pb-2 pr-4">Öğrenci</th>
                <th className="pb-2 pr-4">Durum</th>
                <th className="pb-2 pr-4">Puan</th>
                <th className="pb-2">Tamamlanma</th>
              </tr>
            </thead>
            <tbody>
              {attempts.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-4 text-center text-slate-400">
                    Henüz kimse sınava girmedi.
                  </td>
                </tr>
              )}
              {attempts.map((a) => (
                <tr key={a.id} className="border-b border-slate-100 last:border-0">
                  <td className="py-2 pr-4 font-medium text-slate-900">{a.profiles?.full_name}</td>
                  <td className="py-2 pr-4">
                    {a.submitted_at ? (
                      <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
                        Tamamlandı
                      </span>
                    ) : (
                      <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                        Devam Ediyor
                      </span>
                    )}
                  </td>
                  <td className="py-2 pr-4">{a.score !== null ? `${a.score}/100` : "—"}</td>
                  <td className="py-2">
                    {a.submitted_at
                      ? format(new Date(a.submitted_at), "d MMM yyyy, HH:mm", { locale: tr })
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}