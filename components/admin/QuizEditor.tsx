"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Plus, Trash2, CheckCircle2 } from "lucide-react";
import {
  addQuestion,
  deleteQuestion,
  togglePublish,
  deleteQuiz,
  updateQuizAvailability,
} from "@/app/admin/quizzes/actions";
import type { QuizRow, QuizQuestionRow, QuizAttemptWithStudentRow } from "@/lib/supabase/query-types";
import MathSubmitButton from "@/components/ui/MathSubmitButton";

function isoToTurkeyDatetimeLocal(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const turkeyShifted = new Date(d.getTime() + 3 * 60 * 60 * 1000);
  return turkeyShifted.toISOString().slice(0, 16);
}

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
  const [showAvailabilityForm, setShowAvailabilityForm] = useState(false);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);

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

  const [publishError, setPublishError] = useState<string | null>(null);

  function handleTogglePublish() {
    setPublishError(null);
    startTransition(async () => {
      const result = await togglePublish(quiz.id, !quiz.is_published);
      if ("error" in result) {
        setPublishError(result.error);
        return;
      }
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

  function handleUpdateAvailability(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setAvailabilityError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await updateQuizAvailability(quiz.id, formData);
      if ("error" in result) {
        setAvailabilityError(result.error);
        return;
      }
      setShowAvailabilityForm(false);
      router.refresh();
    });
  }

  const canPublish = questions.length > 0;

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
          {(quiz.available_from || quiz.available_until) && (
            <p className="mt-1 text-sm text-slate-500">
              {quiz.available_from &&
                `Başlangıç: ${format(new Date(quiz.available_from), "d MMM yyyy, HH:mm", { locale: tr })}`}
              {quiz.available_from && quiz.available_until && " — "}
              {quiz.available_until &&
                `Bitiş: ${format(new Date(quiz.available_until), "d MMM yyyy, HH:mm", { locale: tr })}`}
            </p>
          )}
        </div>
        <div className="flex flex-shrink-0 flex-col items-end gap-2">
          <div className="flex gap-2">
            <MathSubmitButton
              type="button"
              onClick={handleTogglePublish}
              loading={isPending}
              pendingText="Yayın durumu güncelleniyor..."
              disabled={!quiz.is_published && !canPublish}
              title={!canPublish && !quiz.is_published ? "Önce en az bir soru ekle" : undefined}
              className={quiz.is_published ? "btn-secondary" : "btn-primary disabled:opacity-50"}
            >
              {quiz.is_published ? "Yayından Kaldır" : "Yayınla"}
            </MathSubmitButton>
            <MathSubmitButton type="button" onClick={handleDeleteQuiz} loading={isPending} pendingText="Sınav siliniyor..." className="btn-secondary text-red-600">
              Sınavı Sil
            </MathSubmitButton>
          </div>
          {publishError && <p className="text-xs text-red-600">{publishError}</p>}
        </div>
      </div>

      <button
        onClick={() => setShowAvailabilityForm((v) => !v)}
        className="mt-3 text-sm font-medium text-brand-600 hover:underline"
      >
        {showAvailabilityForm ? "Zaman ayarlarını kapat" : "Süre / tarih aralığını düzenle"}
      </button>

      {showAvailabilityForm && (
        <form onSubmit={handleUpdateAvailability} className="card mt-3 grid gap-4 sm:grid-cols-3">
          <div>
            <label className="label">Süre (dakika)</label>
            <input
              type="number"
              name="time_limit_minutes"
              min={1}
              defaultValue={quiz.time_limit_minutes ?? ""}
              placeholder="Boş = süresiz"
              className="input"
            />
          </div>
          <div>
            <label className="label">Başlangıç Tarihi/Saati</label>
            <input
              type="datetime-local"
              name="available_from"
              defaultValue={isoToTurkeyDatetimeLocal(quiz.available_from)}
              className="input"
            />
          </div>
          <div>
            <label className="label">Bitiş Tarihi/Saati</label>
            <input
              type="datetime-local"
              name="available_until"
              defaultValue={isoToTurkeyDatetimeLocal(quiz.available_until)}
              className="input"
            />
          </div>
          {availabilityError && (
            <p className="text-sm text-red-600 sm:col-span-3">{availabilityError}</p>
          )}
          <div className="sm:col-span-3">
            <MathSubmitButton type="submit" loading={isPending} pendingText="Sınav ayarları kaydediliyor..." className="btn-primary">
              Kaydet
            </MathSubmitButton>
          </div>
        </form>
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
                <MathSubmitButton type="button" onClick={() => handleDeleteQuestion(q.id)} loading={isPending} pendingText="Soru siliniyor..." title="Soruyu Sil" aria-label="Soruyu Sil" className="flex-shrink-0">
                  <Trash2 className="h-4 w-4 text-slate-400 hover:text-red-600" />
                </MathSubmitButton>
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
          <MathSubmitButton type="submit" loading={isPending} pendingText="Soru ekleniyor..." className="btn-primary mt-4 inline-flex items-center gap-2">
            <Plus className="h-4 w-4" /> Soruyu Ekle
          </MathSubmitButton>
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