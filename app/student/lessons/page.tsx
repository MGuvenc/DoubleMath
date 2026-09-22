import { createClient } from "@/lib/supabase/server";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Video } from "lucide-react";
import type { LessonRow } from "@/lib/supabase/query-types";

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  scheduled: { label: "Planlandı", className: "bg-blue-50 text-blue-700" },
  completed: { label: "Tamamlandı", className: "bg-green-50 text-green-700" },
  cancelled: { label: "İptal Edildi", className: "bg-red-50 text-red-700" },
  reschedule_requested: { label: "Erteleme Talebi", className: "bg-amber-50 text-amber-700" },
};

export default async function StudentLessonsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: lessons } = await supabase
    .from("lessons")
    .select("*")
    .eq("student_id", user!.id)
    .order("starts_at", { ascending: false })
    .returns<LessonRow[]>();

  const now = new Date();
  const upcoming = (lessons || []).filter(
    (l) => new Date(l.starts_at) >= now && l.status !== "cancelled"
  );
  const past = (lessons || []).filter(
    (l) => new Date(l.starts_at) < now || l.status === "completed" || l.status === "cancelled"
  );

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Derslerim</h1>

      <section className="mt-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Yaklaşan Dersler
        </h2>
        <div className="mt-3 space-y-3">
          {upcoming.length === 0 && (
            <div className="card text-sm text-slate-400">Planlanmış bir dersin yok.</div>
          )}
          {upcoming.map((lesson) => {
            const statusInfo = STATUS_LABELS[lesson.status];
            return (
              <div key={lesson.id} className="card flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-900">
                    {format(new Date(lesson.starts_at), "d MMMM EEEE, HH:mm", { locale: tr })}
                  </p>
                  {lesson.topic && <p className="text-sm text-slate-600">Konu: {lesson.topic}</p>}
                  <span className={`mt-2 inline-block rounded-full px-2 py-1 text-xs font-medium ${statusInfo.className}`}>
                    {statusInfo.label}
                  </span>
                </div>
                {lesson.meeting_url && (
                  <a href={lesson.meeting_url} target="_blank" className="btn-primary inline-flex items-center gap-2">
                    <Video className="h-4 w-4" /> Derse Katıl
                  </a>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Geçmiş Dersler
        </h2>
        <div className="mt-3 space-y-3">
          {past.length === 0 && (
            <div className="card text-sm text-slate-400">Henüz geçmiş dersin yok.</div>
          )}
          {past.map((lesson) => {
            const statusInfo = STATUS_LABELS[lesson.status];
            return (
              <div key={lesson.id} className="card">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-slate-900">
                    {format(new Date(lesson.starts_at), "d MMMM yyyy, HH:mm", { locale: tr })}
                  </p>
                  <span className={`rounded-full px-2 py-1 text-xs font-medium ${statusInfo.className}`}>
                    {statusInfo.label}
                  </span>
                </div>
                {lesson.topic && <p className="mt-1 text-sm text-slate-600">Konu: {lesson.topic}</p>}
                {lesson.teacher_notes && (
                  <p className="mt-2 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
                    <strong>Öğretmen notu:</strong> {lesson.teacher_notes}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}