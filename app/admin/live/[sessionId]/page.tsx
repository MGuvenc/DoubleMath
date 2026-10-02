import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CalendarClock, Video } from "lucide-react";
import { LiveSessionJoin } from "@/components/live/LiveSessionJoin";

export default async function AdminLiveSessionPage({ params }: { params: { sessionId: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return notFound();

  const { data: session } = await supabase
    .from("live_sessions")
    .select("*")
    .eq("id", params.sessionId)
    .single();

  if (!session) return notFound();

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">{session.title}</h1>
      <p className="mt-1 text-sm text-slate-500">
        {new Date(session.starts_at).toLocaleString("tr-TR", { dateStyle: "medium", timeStyle: "short" })} · {session.duration_minutes} dk
      </p>

      {session.description && <p className="mt-4 whitespace-pre-wrap text-sm text-slate-600">{session.description}</p>}

      <div className="mt-4 flex items-center gap-2 text-sm text-slate-600">
        <CalendarClock className="h-4 w-4 text-brand-600" />
        Durum: <span className="font-medium text-slate-800">{session.status}</span>
      </div>

      {session.status === "live" ? (
        <div className="mt-6 rounded-2xl border border-brand-200 bg-brand-50 p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-brand-700">
            <Video className="h-4 w-4" />
            Canlı oda
          </div>
          <LiveSessionJoin sessionId={session.id} />
        </div>
      ) : (
        <div className="card mt-6 text-sm text-slate-500">Bu canlı ders henüz başlatılmadı. Öğretmen olarak önce “Başlat” butonuna basın.</div>
      )}
    </div>
  );
}
