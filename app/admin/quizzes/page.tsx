import { createClient } from "@/lib/supabase/server";
import QuizzesManager from "@/components/admin/QuizzesManager";
import type { QuizRow } from "@/lib/supabase/query-types";

export default async function AdminQuizzesPage() {
  const supabase = createClient();

  const { data: quizzes } = await supabase
    .from("quizzes")
    .select("*")
    .order("created_at", { ascending: false })
    .returns<QuizRow[]>();

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Sınavlar</h1>
      <p className="mt-1 text-sm text-slate-500">Online sınav oluştur, soru ekle ve sonuçları gör.</p>

      <div className="mt-6">
        <QuizzesManager quizzes={quizzes || []} />
      </div>
    </div>
  );
}