import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, FileText, MessageCircle, Send } from "lucide-react";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { sendQuestionReply, updateQuestionStatus } from "../actions";

export default async function AdminQuestionConversationPage({
  params,
}: {
  params: { questionId: string };
}) {
  const supabase = createClient();
  const { data: question } = await supabase
    .from("questions")
    .select("*, profiles(full_name), question_messages(*, profiles!question_messages_sender_id_fkey(full_name))")
    .eq("id", params.questionId)
    .maybeSingle();

  if (!question) notFound();

  const adminSupabase = createAdminClient();
  const messages = await Promise.all(
    (((question as any).question_messages || []) as any[])
      .sort((left, right) => new Date(left.created_at).getTime() - new Date(right.created_at).getTime())
      .map(async (message) => ({
        ...message,
        attachmentSignedUrl: message.attachment_url
          ? (await adminSupabase.storage
              .from("submissions")
              .createSignedUrl(message.attachment_url, 3600)).data?.signedUrl || null
          : null,
      }))
  );

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/admin/questions"
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-brand-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Tüm sorular
      </Link>

      <header className="mt-4 flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-brand-50 p-2 text-brand-600">
            <MessageCircle className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">{question.title}</h1>
            <p className="mt-1 text-sm text-slate-500">
              {question.profiles?.full_name || "Öğrenci"} ·{" "}
              {new Date(question.created_at).toLocaleString("tr-TR", { dateStyle: "medium", timeStyle: "short" })}
            </p>
          </div>
        </div>
        <form action={updateQuestionStatus} className="flex items-center gap-2">
          <input type="hidden" name="question_id" value={question.id} />
          <select
            name="status"
            defaultValue={question.status}
            className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-700 outline-none focus:border-brand-300"
          >
            <option value="open">Açık</option>
            <option value="answered">Cevaplandı</option>
            <option value="closed">Kapandı</option>
          </select>
          <button type="submit" className="btn-secondary py-2 text-xs">
            Güncelle
          </button>
        </form>
      </header>

      <section aria-label="Mesajlaşma" className="space-y-4 py-6">
        {messages.map((message) => {
          const isTeacher = message.sender_id !== question.student_id;
          const isImage = /\.(jpe?g|png|webp)$/i.test(message.attachment_url || "");

          return (
            <div key={message.id} className={`flex ${isTeacher ? "justify-end" : "justify-start"}`}>
              <article
                className={`max-w-[90%] rounded-xl border p-4 sm:max-w-[80%] ${
                  isTeacher ? "border-brand-200 bg-brand-50" : "border-slate-200 bg-white"
                }`}
              >
                <div className="mb-2 flex items-center justify-between gap-6 text-xs text-slate-500">
                  <span className="font-semibold">
                    {isTeacher ? "Öğretmen" : message.profiles?.full_name || "Öğrenci"}
                  </span>
                  <time>
                    {new Date(message.created_at).toLocaleString("tr-TR", { dateStyle: "medium", timeStyle: "short" })}
                  </time>
                </div>
                <p className="whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">{message.body}</p>
                {message.attachmentSignedUrl && (
                  <div className="mt-3">
                    {isImage ? (
                      <a href={message.attachmentSignedUrl} target="_blank" rel="noreferrer">
                        <img
                          src={message.attachmentSignedUrl}
                          alt="Öğrencinin eklediği görsel"
                          className="max-h-80 max-w-full rounded-lg border border-slate-200 object-contain"
                        />
                      </a>
                    ) : (
                      <a
                        href={message.attachmentSignedUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-brand-700 hover:border-brand-300"
                      >
                        <FileText className="h-4 w-4" />
                        PDF ekini aç
                      </a>
                    )}
                  </div>
                )}
              </article>
            </div>
          );
        })}
      </section>

      <form action={sendQuestionReply} className="border-t border-slate-200 pt-5">
        <input type="hidden" name="question_id" value={question.id} />
        <label htmlFor="teacher-reply" className="mb-2 block text-sm font-semibold text-slate-800">
          Öğrenciye mesaj yaz
        </label>
        <textarea
          id="teacher-reply"
          name="body"
          rows={4}
          required
          placeholder="Yanıtınızı yazın..."
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-brand-300 focus:ring-2 focus:ring-brand-100"
        />
        <div className="mt-3 flex justify-end">
          <button type="submit" className="btn-primary inline-flex items-center gap-2">
            <Send className="h-4 w-4" />
            Gönder
          </button>
        </div>
      </form>
    </div>
  );
}
