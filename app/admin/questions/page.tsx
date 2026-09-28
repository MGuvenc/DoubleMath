import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { MessageCircle } from "lucide-react";

export async function updateQuestionStatus(formData: FormData) {
  "use server";

  const supabase = createClient();
  const questionId = formData.get("question_id");
  const status = formData.get("status");

  if (typeof questionId !== "string" || !questionId) return;
  if (status !== "open" && status !== "answered" && status !== "closed") return;

  const { error } = await supabase
    .from("questions")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", questionId);

  if (!error) {
    revalidatePath("/admin/questions");
  }
}

export default async function AdminQuestionsPage() {
  const supabase = createClient();

  const { data: questions } = await supabase
    .from("questions")
    .select("*, profiles(full_name)")
    .order("created_at", { ascending: false });

  const { data: messages } = await supabase
    .from("question_messages")
    .select("question_id, body, created_at")
    .order("created_at", { ascending: false });

  const messageMap = new Map<string, string>();
  for (const message of messages || []) {
    if (!messageMap.has(message.question_id)) {
      messageMap.set(message.question_id, message.body);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Öğretmene Sorular</h1>
      <p className="mt-1 text-sm text-slate-500">Öğrenci sorularını takip edip durumu güncelle.</p>

      <div className="mt-6 space-y-3">
        {(questions || []).length === 0 && (
          <div className="card text-center text-sm text-slate-400">Henüz soru gelmemiş.</div>
        )}

        {(questions || []).map((question) => (
          <div key={question.id} className="card">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-brand-50 p-2 text-brand-600">
                  <MessageCircle className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">{question.title}</p>
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

            <p className="mt-4 text-sm text-slate-600">{messageMap.get(question.id) || "Henüz öğrenciye gönderilmiş bir mesaj yok."}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
