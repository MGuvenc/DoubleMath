import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { ChevronRight, MessageCircle, Paperclip } from "lucide-react";

export default async function AdminQuestionsPage() {
  const supabase = createClient();

  const { data: questions } = await supabase
    .from("questions")
    .select("id, title, status, student_id, created_at, profiles(full_name), question_messages(body, attachment_url, created_at)")
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Öğretmene Sorular</h1>
      <p className="mt-1 text-sm text-slate-500">Öğrenci konuşmalarını açıp yanıtla.</p>

      <div className="mt-6 space-y-4">
        {(questions || []).length === 0 && (
          <div className="card text-center text-sm text-slate-400">Henüz soru gelmemiş.</div>
        )}

        {(questions || []).map((question) => {
          const messages = [...((question as any).question_messages || [])].sort(
            (left, right) => new Date(left.created_at).getTime() - new Date(right.created_at).getTime()
          );
          const latestMessage = messages[messages.length - 1];
          const hasAttachment = messages.some((message) => Boolean(message.attachment_url));

          return (
            <div key={question.id} className="card flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <Link
                href={`/admin/questions/${question.id}`}
                className="group flex min-w-0 flex-1 items-start gap-3 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
              >
                <div className="rounded-lg bg-brand-50 p-2 text-brand-600">
                  <MessageCircle className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-semibold text-slate-900 group-hover:text-brand-700">{question.title}</h2>
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        question.status === "open"
                          ? "bg-amber-50 text-amber-700"
                          : question.status === "answered"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {question.status === "open" ? "Açık" : question.status === "answered" ? "Cevaplandı" : "Kapandı"}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {question.profiles?.full_name || "Öğrenci"} · {new Date(question.created_at).toLocaleString("tr-TR", { dateStyle: "medium", timeStyle: "short" })}
                  </p>
                  <p className="mt-2 truncate text-sm text-slate-600">
                    {latestMessage?.body || "Henüz mesaj yok."}
                  </p>
                  {hasAttachment && (
                    <span className="mt-2 inline-flex items-center gap-1 text-xs text-slate-500">
                      <Paperclip className="h-3.5 w-3.5" />
                      Ek dosya var
                    </span>
                  )}
                </div>
                <span className="mt-1 hidden shrink-0 items-center gap-1 text-sm font-medium text-brand-700 sm:inline-flex">
                  Sohbeti aç <ChevronRight className="h-4 w-4" />
                </span>
              </Link>
              <Link
                href={`/admin/questions/${question.id}`}
                className="inline-flex items-center justify-center gap-1 rounded-lg border border-brand-200 px-3 py-2 text-sm font-medium text-brand-700 hover:bg-brand-50 sm:hidden"
              >
                Sohbeti aç <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
