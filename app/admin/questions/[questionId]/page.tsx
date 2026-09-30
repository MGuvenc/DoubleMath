import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, FileText, MessageCircle, Paperclip, Send } from "lucide-react";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { STUDENT_ACCEPT_ATTR } from "@/lib/file-validation";
import { sendQuestionReply } from "../actions";
import MathSubmitButton from "@/components/ui/MathSubmitButton";

export default async function AdminQuestionConversationPage({
  params,
  searchParams,
}: {
  params: { questionId: string };
  searchParams?: { error?: string };
}) {
  const supabase = createClient();
  const { data: question } = await supabase
    .from("questions")
    .select("*, profiles(full_name, email), question_messages(*, profiles!question_messages_sender_id_fkey(full_name, email))")
    .eq("id", params.questionId)
    .maybeSingle();

  if (!question) notFound();

  const studentProfile = question.profiles?.[0];
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
              {studentProfile?.full_name || "Öğrenci"}
              {studentProfile?.email ? ` · ${studentProfile.email}` : ""}
            </p>
          </div>
        </div>
        <span className="inline-flex h-fit rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
          Açık konuşma
        </span>
      </header>

      {searchParams?.error && (
        <p role="alert" className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {searchParams.error === "invalid-file"
            ? "Dosya türü desteklenmiyor veya dosya 10 MB sınırını aşıyor."
            : searchParams.error === "upload-failed"
              ? "Dosya yüklenemedi. Tekrar deneyin veya daha küçük bir dosya seçin."
              : searchParams.error === "message-save"
                ? "Mesaj kaydedilemedi. Lütfen tekrar deneyin."
                : "Mesaj veya dosya eklemeden gönderemezsiniz."}
        </p>
      )}

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
                    {isTeacher
                      ? message.profiles?.[0]?.full_name || "Öğretmen"
                      : `${studentProfile?.full_name || "Öğrenci"}${studentProfile?.email ? ` · ${studentProfile.email}` : ""}`}
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
          placeholder="Yanıtınızı yazın..."
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-brand-300 focus:ring-2 focus:ring-brand-100"
        />
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-slate-600">
            <Paperclip className="h-4 w-4" />
            <span>PDF veya resim ekle</span>
            <input type="file" name="attachment" accept={STUDENT_ACCEPT_ATTR} className="max-w-56 text-xs" />
          </label>
          <MathSubmitButton className="btn-primary inline-flex items-center gap-2" pendingText="Mesaj gönderiliyor...">
            <Send className="h-4 w-4" />
            Gönder
          </MathSubmitButton>
        </div>
        <p className="mt-2 text-xs text-slate-400">PDF, DOC, JPG, PNG veya WebP · En fazla 10 MB</p>
      </form>
    </div>
  );
}
