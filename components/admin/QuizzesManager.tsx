"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Plus, ClipboardCheck } from "lucide-react";
import { createQuiz } from "@/app/admin/quizzes/actions";
import type { QuizRow } from "@/lib/supabase/query-types";

export default function QuizzesManager({ quizzes }: { quizzes: QuizRow[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await createQuiz(formData);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      router.push(`/admin/quizzes/${result.id}`);
    });
  }

  return (
    <div>
      <div className="flex justify-end">
        <button onClick={() => setShowForm((v) => !v)} className="btn-primary inline-flex items-center gap-2">
          <Plus className="h-4 w-4" /> Yeni Sınav Oluştur
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="card mt-4 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="label">Başlık *</label>
            <input name="title" required className="input" placeholder="Örn: Türev - Genel Tekrar" />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Açıklama</label>
            <textarea name="description" rows={2} className="input" />
          </div>
          <div>
            <label className="label">Süre (dakika)</label>
            <input
              type="number"
              name="time_limit_minutes"
              min={1}
              className="input"
              placeholder="Boş = süresiz"
            />
          </div>
          {error && <p className="text-sm text-red-600 sm:col-span-2">{error}</p>}
          <div className="flex gap-3 sm:col-span-2">
            <button type="submit" disabled={isPending} className="btn-primary">
              {isPending ? "Oluşturuluyor..." : "Oluştur ve Soru Eklemeye Başla"}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">
              Vazgeç
            </button>
          </div>
        </form>
      )}

      <div className="mt-6 space-y-3">
        {quizzes.length === 0 && (
          <div className="card text-center text-sm text-slate-400">Henüz sınav oluşturulmadı.</div>
        )}
        {quizzes.map((q) => (
          <Link
            key={q.id}
            href={`/admin/quizzes/${q.id}`}
            className="card flex items-center justify-between hover:border-brand-300"
          >
            <div className="flex items-center gap-3">
              <ClipboardCheck className="h-5 w-5 text-brand-600" />
              <div>
                <p className="font-medium text-slate-900">{q.title}</p>
                <p className="text-xs text-slate-400">
                  {format(new Date(q.created_at), "d MMM yyyy", { locale: tr })}
                  {q.time_limit_minutes ? ` — ${q.time_limit_minutes} dk` : " — Süresiz"}
                </p>
              </div>
            </div>
            <span
              className={`rounded-full px-2 py-1 text-xs font-medium ${
                q.is_published ? "bg-green-50 text-green-700" : "bg-slate-100 text-slate-600"
              }`}
            >
              {q.is_published ? "Yayında" : "Taslak"}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}