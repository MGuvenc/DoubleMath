import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Video, Clock3, ArrowRight } from "lucide-react";
import { LiveSessionJoin } from "@/components/live/LiveSessionJoin";

export default async function StudentLivePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: sessions } = await supabase
    .from("live_sessions")
    .select("*")
    .order("starts_at", { ascending: true });

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Canlı Dersler</h1>
      <p className="mt-1 text-sm text-slate-500">Öğretmeninizin planladığı canlı dersleri takip edin ve katılın.</p>

      <div className="mt-6 space-y-4">
        {(sessions || []).length === 0 && (
          <div className="card text-center text-sm text-slate-400">Şu anda planlanmış canlı ders yok.</div>
        )}

        {(sessions || []).map((session) => (
          <div key={session.id} className="card">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2 text-brand-600">
                  <Video className="h-4 w-4" />
                  <span className="font-semibold text-slate-900">{session.title}</span>
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  {new Date(session.starts_at).toLocaleString("tr-TR", { dateStyle: "medium", timeStyle: "short" })} · {session.duration_minutes} dk · {session.target_mode === "all" ? "Herkese açık" : "Özel ders"}
                </p>
              </div>

              <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                {session.status}
              </span>
            </div>

            {session.description && <p className="mt-3 whitespace-pre-wrap text-sm text-slate-600">{session.description}</p>}

            {session.status === "live" && (
              <div className="mt-4 flex flex-col gap-3">
                <Link
                  href={`/student/live/${session.id}`}
                  className="inline-flex w-fit items-center gap-2 rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700"
                >
                  Canlı derse katıl
                  <ArrowRight className="h-4 w-4" />
                </Link>

                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
                  <div className="flex items-center gap-2 font-medium">
                    <Clock3 className="h-4 w-4" />
                    Canlı ders başlatılmış
                  </div>
                  <LiveSessionJoin sessionId={session.id} />
                </div>
              </div>
            )}

            {session.status !== "live" && (
              <p className="mt-4 text-sm text-slate-500">Bu canlı ders henüz başlatılmadı. Başlangıç saatine göre öğretmeninizin açmasını bekleyin.</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
