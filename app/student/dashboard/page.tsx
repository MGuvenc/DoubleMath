import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Calendar, Clock, ClipboardList } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

export default async function StudentDashboard() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: upcomingLessons } = await supabase
    .from("lessons")
    .select("*")
    .eq("student_id", user!.id)
    .eq("status", "scheduled")
    .gte("starts_at", new Date().toISOString())
    .order("starts_at", { ascending: true })
    .limit(3);

  const { data: pendingAssignments } = await supabase
    .from("submissions")
    .select("*, assignments(title, due_at)")
    .eq("student_id", user!.id)
    .in("status", ["pending"])
    .limit(5);

  const nextLesson = upcomingLessons?.[0];

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Panelim</h1>

      {nextLesson ? (
        <div className="card mt-6 flex items-center justify-between bg-brand-50">
          <div className="flex items-center gap-4">
            <Calendar className="h-8 w-8 text-brand-600" />
            <div>
              <p className="text-sm text-slate-500">Sıradaki Dersin</p>
              <p className="font-semibold text-slate-900">
                {format(new Date(nextLesson.starts_at), "d MMMM EEEE, HH:mm", { locale: tr })}
              </p>
              {nextLesson.topic && (
                <p className="text-sm text-slate-600">Konu: {nextLesson.topic}</p>
              )}
            </div>
          </div>
          {nextLesson.meeting_url && (
            <a href={nextLesson.meeting_url} target="_blank" className="btn-primary">
              Derse Katıl
            </a>
          )}
        </div>
      ) : (
        <div className="card mt-6 text-slate-600">Şu an planlanmış bir dersin yok.</div>
      )}

      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        <div className="card">
          <h2 className="flex items-center gap-2 font-semibold text-slate-900">
            <Clock className="h-5 w-5 text-brand-600" /> Yaklaşan Dersler
          </h2>
          <ul className="mt-4 space-y-3">
            {upcomingLessons?.length ? (
              upcomingLessons.map((l) => (
                <li key={l.id} className="text-sm text-slate-600">
                  {format(new Date(l.starts_at), "d MMM, HH:mm", { locale: tr })} — {l.topic || l.title}
                </li>
              ))
            ) : (
              <li className="text-sm text-slate-400">Planlanmış ders yok.</li>
            )}
          </ul>
          <Link href="/student/lessons" className="mt-4 inline-block text-sm font-medium text-brand-600">
            Tüm dersleri gör →
          </Link>
        </div>

        <div className="card">
          <h2 className="flex items-center gap-2 font-semibold text-slate-900">
            <ClipboardList className="h-5 w-5 text-brand-600" /> Bekleyen Ödevler
          </h2>
          <ul className="mt-4 space-y-3">
            {pendingAssignments?.length ? (
              pendingAssignments.map((s: any) => (
                <li key={s.id} className="text-sm text-slate-600">
                  {s.assignments?.title} — Son tarih:{" "}
                  {format(new Date(s.assignments?.due_at), "d MMM", { locale: tr })}
                </li>
              ))
            ) : (
              <li className="text-sm text-slate-400">Bekleyen ödev yok.</li>
            )}
          </ul>
          <Link href="/student/assignments" className="mt-4 inline-block text-sm font-medium text-brand-600">
            Tüm ödevleri gör →
          </Link>
        </div>
      </div>
    </div>
  );
}
