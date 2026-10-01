import { createAdminClient } from "@/lib/supabase/server";
import TopicProgressManager from "@/components/admin/TopicProgressManager";
import type { StudentOption, TopicProgressWithStudentRow } from "@/lib/supabase/query-types";

export default async function AdminProgressPage() {
  const supabase = createAdminClient();
  const [{ data: students }, { data: progress }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, email, grade_level")
      .eq("role", "student")
      .eq("is_active", true)
      .order("full_name")
      .returns<StudentOption[]>(),
    supabase
      .from("topics_progress")
      .select("id, student_id, lesson_id, topic, mastery_level, comment, created_at, profiles(full_name, email)")
      .order("created_at", { ascending: false })
      .limit(100)
      .returns<TopicProgressWithStudentRow[]>(),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Öğrenci İlerlemesi</h1>
      <p className="mt-1 text-sm text-slate-500">Konu değerlendirmelerini ekle; öğrenci kendi panelinden seviye ve notlarını görsün.</p>
      <div className="mt-6">
        <TopicProgressManager students={students || []} progress={progress || []} />
      </div>
    </div>
  );
}