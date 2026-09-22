import { createClient } from "@/lib/supabase/server";
import LessonsManager from "@/components/admin/LessonsManager";
import type { LessonWithStudentRow, StudentOption } from "@/lib/supabase/query-types";

export default async function AdminLessonsPage() {
  const supabase = createClient();

  const { data: students } = await supabase
    .from("profiles")
    .select("id, full_name, email, grade_level")
    .eq("role", "student")
    .eq("is_active", true)
    .order("full_name")
    .returns<StudentOption[]>();

  const { data: lessons } = await supabase
    .from("lessons")
    .select("*, profiles(full_name, email)")
    .order("starts_at", { ascending: false })
    .limit(100)
    .returns<LessonWithStudentRow[]>();

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Ders Programı</h1>
      <p className="mt-1 text-sm text-slate-500">
        Öğrencilerin ders saatlerini oluştur, düzenle veya iptal et.
      </p>

      <div className="mt-6">
        <LessonsManager students={students || []} initialLessons={lessons || []} />
      </div>
    </div>
  );
}