import { createAdminClient, createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { FileText, MessageCircle, Send } from "lucide-react";
import { sendQuestionReply, updateQuestionStatus } from "./actions";

export default async function AdminQuestionsPage() {
  const supabase = createClient();
  const adminSupabase = createAdminClient();

  const { data: questions } = await supabase
    .from("questions")
    .select("*, profiles(full_name), question_messages(*, profiles!question_messages_sender_id_fkey(full_name))")
    .order("created_at", { ascending: false });

  const questionsWithAttachments = await Promise.all(
    (questions || []).map(async (question) => ({
      ...question,
      question_messages: await Promise.all(
        (((question as any).question_messages || []) as any[]).map(async (message) => ({
          ...message,
          attachmentSignedUrl: message.attachment_url
            ? (await adminSupabase.storage
                .from("question-attachments")
                .createSignedUrl(message.attachment_url, 3600)).data?.signedUrl || null
            : null,
        }))
      ),
    }))
  );

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Öğretmene Sorular</h1>
      <p className="mt-1 text-sm text-slate-500">Öğrenci sorularını takip edip durumu güncelle.</p>

      <div className="mt-6 space-y-4">
        {questionsWithAttachments.length === 0 && (
          <div className="card text-center text-sm text-slate-400">Henüz soru gelmemiş.</div>
        )}

        {questionsWithAttachments.map((question) => {
          const messages = [...((question as any).question_messages || [])].sort(
            (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );

          return (
            <div key={question.id} className="card">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-brand-50 p-2 text-brand-600">
                    <MessageCircle className="h-4 w-4" />
                  </div>
                  <div>
                    <Link
                      href={`/admin/questions/${question.id}`}
                      className="font-semibold text-slate-900 hover:text-brand-700"
                    >
                      {question.title}
                    </Link>
                    <p className="mt-1 text-xs text-slate-500">
                      {question.profiles?.full_name || "Öğrenci"} · {new Date(question.created_at).toLocaleString("tr-TR", { dateStyle: "medium", timeStyle: "short" })}
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
              </div>

              <div className="mt-4 space-y-3 rounded-xl bg-slate-50 p-3">
                {messages.length === 0 && (
                  <p className="text-sm text-slate-500">Henüz mesaj yok.</p>
                )}
                {messages.map((message) => {
                  const senderName = message.profiles?.full_name || "Kullanıcı";
                  const isTeacher = message.sender_id !== question.student_id;

                  return (
                    <div
                      key={message.id}
                      className={`rounded-lg border p-3 text-sm ${
                        isTeacher ? "border-brand-200 bg-brand-50" : "border-slate-200 bg-white"
                      }`}
                    >
                      <div className="mb-1 flex items-center justify-between gap-2 text-xs text-slate-500">
                        <span>{senderName}</span>
                        <span>
                          {new Date(message.created_at).toLocaleString("tr-TR", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </span>
                      </div>
                      <p className="whitespace-pre-wrap text-slate-700">{message.body}</p>
                      {message.attachmentSignedUrl && (
                        <div className="mt-3">
                          {/\.(jpe?g|png|webp)$/i.test(message.attachment_url || "") ? (
                            <a href={message.attachmentSignedUrl} target="_blank" rel="noreferrer">
                              <img
                                src={message.attachmentSignedUrl}
                                alt="Öğrencinin eklediği görsel"
                                className="max-h-72 max-w-full rounded-lg border border-slate-200 object-contain"
                              />
                            </a>
                          ) : (
                            <a
                              href={message.attachmentSignedUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-2 text-sm font-medium text-brand-700 hover:underline"
                            >
                              <FileText className="h-4 w-4" />
                              Ekli PDF/dosyayı aç
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <form action={sendQuestionReply} className="mt-4 space-y-2">
                <input type="hidden" name="question_id" value={question.id} />
                <label className="block text-sm font-medium text-slate-700">Cevap yaz</label>
                <textarea
                  name="body"
                  rows={3}
                  required
                  placeholder="Öğrenciye cevap yaz..."
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-brand-300 focus:ring-2 focus:ring-brand-100"
                />
                <button type="submit" className="btn-primary inline-flex items-center gap-2">
                  <Send className="h-4 w-4" />
                  Gönder
                </button>
              </form>
            </div>
          );
        })}
      </div>
    </div>
  );
}
