import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { MessageCircle, Plus } from "lucide-react";
import { STUDENT_ACCEPT_ATTR } from "@/lib/file-validation";
import { createQuestion } from "./actions";

export default async function StudentQuestionsPage({
  searchParams,
}: {
  searchParams?: { error?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: questions } = await supabase
    .from("questions")
    .select("id, title, status, created_at, question_messages(body, created_at)")
    .eq("student_id", user.id)
    .order("created_at", { ascending: false });

  const normalizedQuestions = (questions || []).map((question) => {
    const messages = [...((question as any).question_messages || [])].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return {
      ...question,
      lastMessage: messages[0]?.body || "Henüz öğretmene gönderilmiş bir cevap yok.",
    };
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Öğretmene Sor</h1>
      <p className="mt-1 text-sm text-slate-500">Takıldığın konuları derhal öğretmenine iletebilirsin.</p>

      {searchParams?.error && (
        <p role="alert" className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {searchParams.error === "invalid-file"
            ? "Dosya PDF/JPG/PNG/WebP olmalı ve 10 MB sınırını aşmamalı."
            : searchParams.error === "upload-failed"
              ? "Dosya yüklenemedi. Tekrar deneyin veya daha küçük bir PDF/resim seçin."
              : searchParams.error === "message-save"
                ? "Mesaj kaydedilemedi. Lütfen tekrar deneyin."
                : searchParams.error === "question-create"
                  ? "Soru oluşturulamadı. Lütfen tekrar deneyin."
                  : "Konu başlığı ve mesaj veya dosya eki gereklidir."}
        </p>
      )}

      <form action={createQuestion} className="card mt-6">
        <div className="flex items-center gap-2 font-semibold text-slate-900">
          <Plus className="h-5 w-5 text-brand-600" />
          Yeni soru oluştur
        </div>
        <div className="mt-4">
          <label htmlFor="question-title" className="mb-2 block text-sm font-medium text-slate-700">
            Soru başlığı
          </label>
          <input
            id="question-title"
            name="title"
            type="text"
            required
            placeholder="Örneğin: Üçgenlerde alan formülünü tekrar anlatabilir misiniz?"
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-brand-300 focus:ring-2 focus:ring-brand-100"
          />
        </div>
        <div className="mt-4">
          <label htmlFor="question-body" className="mb-2 block text-sm font-medium text-slate-700">
            Mesajın
          </label>
          <textarea
            id="question-body"
            name="body"
            rows={4}
            placeholder="Sorunu veya takıldığın yeri anlat..."
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-brand-300 focus:ring-2 focus:ring-brand-100"
          />
        </div>
        <div className="mt-4">
          <label htmlFor="question-attachment" className="mb-2 block text-sm font-medium text-slate-700">
            Dosya eki (PDF veya resim, en fazla 10 MB)
          </label>
          <input
            id="question-attachment"
            name="attachment"
            type="file"
            accept={STUDENT_ACCEPT_ATTR}
            className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:font-medium file:text-brand-700 hover:file:bg-brand-100"
          />
        </div>
        <button type="submit" className="btn-primary mt-4">
          Soruyu Gönder
        </button>
      </form>

      <div className="mt-8 space-y-3">
        {normalizedQuestions.length === 0 && (
          <div className="card text-center text-sm text-slate-400">
            Henüz öğretmene gönderilmiş bir soru yok.
          </div>
        )}

        {normalizedQuestions.map((question) => (
          <Link
            key={question.id}
            href={`/student/questions/${question.id}`}
            className="card block transition hover:border-brand-300 hover:shadow-sm"
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-brand-50 p-2 text-brand-600">
                  <MessageCircle className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="font-semibold text-slate-900">{question.title}</h2>
                  <p className="mt-1 text-xs text-slate-500">
                    {new Date(question.created_at).toLocaleString("tr-TR", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </p>
                </div>
              </div>

              <span
                className={
                  question.status === "open"
                    ? "inline-flex rounded-full bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700"
                    : question.status === "answered"
                      ? "inline-flex rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700"
                      : "inline-flex rounded-full bg-slate-200 px-2 py-1 text-xs font-medium text-slate-700"
                }
              >
                {question.status === "open"
                  ? "Açık"
                  : question.status === "answered"
                    ? "Cevaplandı"
                    : "Kapandı"}
              </span>
            </div>

            <p className="mt-4 text-sm text-slate-600">{question.lastMessage}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
