import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, FileText, MessageCircle, Paperclip, Send } from "lucide-react";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { STUDENT_ACCEPT_ATTR } from "@/lib/file-validation";
import { replyToQuestion } from "../actions";

export default async function StudentQuestionConversationPage({
  params,
}: {
  params: { questionId: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: question } = await supabase
    .from("questions")
    .select("id, title, status, created_at")
    .eq("id", params.questionId)
    .eq("student_id", user.id)
    .maybeSingle();

  if (!question) notFound();

  await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("recipient_id", user.id)
    .eq("link", `/student/questions?question_id=${question.id}`)
    .eq("is_read", false);

  const { data: messages } = await supabase
    .from("question_messages")
    .select("id, sender_id, body, attachment_url, created_at")
    .eq("question_id", question.id)
    .order("created_at", { ascending: true });

  const adminSupabase = createAdminClient();
  const conversation = await Promise.all(
    (messages || []).map(async (message) => {
      const attachmentUrl = message.attachment_url
        ? (await adminSupabase.storage
            .from("question-attachments")
            .createSignedUrl(message.attachment_url, 3600)).data?.signedUrl || null
        : null;

      return { ...message, attachmentUrl };
    })
  );

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/student/questions"
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-brand-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Sorularım
      </Link>

      <div className="mt-4 border-b border-slate-200 pb-5">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-brand-50 p-2 text-brand-600">
            <MessageCircle className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-bold text-slate-900">{question.title}</h1>
            <p className="mt-1 text-sm text-slate-500">
              {question.status === "closed" ? "Kapalı" : question.status === "answered" ? "Cevaplandı" : "Açık"}
              {" · "}
              {new Date(question.created_at).toLocaleString("tr-TR", { dateStyle: "medium", timeStyle: "short" })}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4 py-6">
        {conversation.map((message) => {
          const isStudent = message.sender_id === user.id;
          const isImage = /\.(jpe?g|png|webp)$/i.test(message.attachment_url || "");
          const fileName = message.attachment_url?.split("/").pop()?.replace(/^[^-]+-/, "") || "Ekli dosya";

          return (
            <div key={message.id} className={`flex ${isStudent ? "justify-end" : "justify-start"}`}>
              <article
                className={`max-w-[90%] rounded-xl border p-4 sm:max-w-[80%] ${
                  isStudent ? "border-brand-200 bg-brand-50" : "border-slate-200 bg-white"
                }`}
              >
                <div className="mb-2 flex items-center justify-between gap-6 text-xs text-slate-500">
                  <span className="font-semibold">{isStudent ? "Sen" : "Öğretmenin"}</span>
                  <time>
                    {new Date(message.created_at).toLocaleString("tr-TR", { dateStyle: "medium", timeStyle: "short" })}
                  </time>
                </div>
                <p className="whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">{message.body}</p>
                {message.attachmentUrl && (
                  <div className="mt-3">
                    {isImage ? (
                      <a href={message.attachmentUrl} target="_blank" rel="noreferrer" className="block">
                        <img
                          src={message.attachmentUrl}
                          alt={fileName}
                          className="max-h-80 max-w-full rounded-lg border border-slate-200 object-contain"
                        />
                      </a>
                    ) : (
                      <a
                        href={message.attachmentUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-brand-700 hover:border-brand-300"
                      >
                        <FileText className="h-4 w-4" />
                        {fileName}
                      </a>
                    )}
                  </div>
                )}
              </article>
            </div>
          );
        })}
      </div>

      <form action={replyToQuestion} encType="multipart/form-data" className="border-t border-slate-200 pt-5">
        <input type="hidden" name="question_id" value={question.id} />
        <label htmlFor="reply-body" className="mb-2 block text-sm font-semibold text-slate-800">
          Mesaj yaz
        </label>
        <textarea
          id="reply-body"
          name="body"
          rows={4}
          placeholder="Öğretmenine cevap yaz..."
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-brand-300 focus:ring-2 focus:ring-brand-100"
        />
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-slate-600">
            <Paperclip className="h-4 w-4" />
            <span>PDF veya resim ekle</span>
            <input type="file" name="attachment" accept={STUDENT_ACCEPT_ATTR} className="max-w-56 text-xs" />
          </label>
          <button type="submit" className="btn-primary inline-flex items-center justify-center gap-2">
            <Send className="h-4 w-4" />
            Gönder
          </button>
        </div>
        <p className="mt-2 text-xs text-slate-400">PDF, JPG, PNG veya WebP · En fazla 10 MB</p>
      </form>
    </div>
  );
}
