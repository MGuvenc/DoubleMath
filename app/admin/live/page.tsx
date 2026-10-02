import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Video, CalendarClock, ArrowRight } from "lucide-react";
import { createLiveSession, startLiveSession, endLiveSession, cancelLiveSession } from "./actions";
import MathSubmitButton from "@/components/ui/MathSubmitButton";

export default async function AdminLivePage() {
  const supabase = createClient();
  const [{ data: students }, { data: sessions }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name")
      .eq("role", "student")
      .eq("is_active", true)
      .order("full_name"),
    supabase
      .from("live_sessions")
      .select("*, live_session_targets(student_id)")
      .order("starts_at", { ascending: true }),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Canlı Dersler</h1>
      <p className="mt-1 text-sm text-slate-500">Herkese açık veya belirli öğrencilere özel canlı ders oluştur.</p>

      <form action={createLiveSession} className="card mt-6">
        <div className="flex items-center gap-2 font-semibold text-slate-900">
          <Video className="h-5 w-5 text-brand-600" />
          Yeni canlı ders planla
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label htmlFor="live-title" className="mb-2 block text-sm font-medium text-slate-700">
              Başlık
            </label>
            <input id="live-title" name="title" required className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-brand-300 focus:ring-2 focus:ring-brand-100" />
          </div>

          <div className="md:col-span-2">
            <label htmlFor="live-description" className="mb-2 block text-sm font-medium text-slate-700">
              Açıklama
            </label>
            <textarea id="live-description" name="description" rows={3} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-brand-300 focus:ring-2 focus:ring-brand-100" />
          </div>

          <div>
            <label htmlFor="live-starts" className="mb-2 block text-sm font-medium text-slate-700">
              Başlangıç tarihi ve saati
            </label>
            <input id="live-starts" name="starts_at" type="datetime-local" required className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-brand-300 focus:ring-2 focus:ring-brand-100" />
          </div>

          <div>
            <label htmlFor="live-duration" className="mb-2 block text-sm font-medium text-slate-700">
              Süre (dakika)
            </label>
            <input id="live-duration" name="duration_minutes" type="number" min={15} max={240} defaultValue={60} required className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-brand-300 focus:ring-2 focus:ring-brand-100" />
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-medium text-slate-700">Hedef kitle</label>
            <div className="flex flex-wrap gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input type="radio" name="target_mode" value="all" defaultChecked />
                Herkese açık
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input type="radio" name="target_mode" value="specific" />
                Sadece seçili öğrenciler
              </label>
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-medium text-slate-700">Öğrenci seçimi</label>
            <div className="max-h-52 space-y-2 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-3">
              {(students || []).length === 0 ? (
                <p className="text-sm text-slate-400">Aktif öğrenci bulunmuyor.</p>
              ) : (
                (students || []).map((student) => (
                  <label key={student.id} className="flex items-center gap-2 text-sm text-slate-700">
                    <input type="checkbox" name="student_ids" value={student.id} />
                    {student.full_name}
                  </label>
                ))
              )}
            </div>
          </div>
        </div>

        <MathSubmitButton className="btn-primary mt-4" pendingText="Canlı ders kaydediliyor...">
          Canlı ders oluştur
        </MathSubmitButton>
      </form>

      <div className="mt-8 space-y-3">
        {(sessions || []).length === 0 && (
          <div className="card text-center text-sm text-slate-400">Henüz canlı ders planlanmadı.</div>
        )}

        {(sessions || []).map((session) => {
          const targetStudentCount = (session.live_session_targets || []).length;

          return (
            <div key={session.id} className="card">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="font-semibold text-slate-900">{session.title}</h2>
                  <p className="mt-1 text-xs text-slate-500">
                    {new Date(session.starts_at).toLocaleString("tr-TR", { dateStyle: "medium", timeStyle: "short" })} · {session.duration_minutes} dk · {session.target_mode === "all" ? "Herkese açık" : `${targetStudentCount} öğrenci özel`}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {session.status === "live" && (
                    <Link
                      href={`/admin/live/${session.id}`}
                      className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-3 py-2 text-xs font-medium text-white hover:bg-brand-700"
                    >
                      Katıl
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  )}

                  {session.status === "scheduled" && (
                    <form action={startLiveSession.bind(null, session.id)}>
                      <MathSubmitButton className="btn-primary text-xs" pendingText="Başlatılıyor...">
                        Başlat
                      </MathSubmitButton>
                    </form>
                  )}

                  {session.status === "live" && (
                    <form action={endLiveSession.bind(null, session.id)}>
                      <MathSubmitButton className="btn-secondary text-xs" pendingText="Bitiriliyor...">
                        Bitir
                      </MathSubmitButton>
                    </form>
                  )}

                  {session.status === "scheduled" && (
                    <form action={cancelLiveSession.bind(null, session.id)}>
                      <MathSubmitButton className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700 hover:bg-rose-100" pendingText="İptal ediliyor...">
                        İptal
                      </MathSubmitButton>
                    </form>
                  )}
                </div>
              </div>

              {session.description && <p className="mt-3 whitespace-pre-wrap text-sm text-slate-600">{session.description}</p>}

              <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                <CalendarClock className="h-4 w-4" />
                Durum: <span className="font-medium text-slate-700">{session.status}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
