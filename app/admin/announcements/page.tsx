import { createClient } from "@/lib/supabase/server";
import { Bell } from "lucide-react";
import { createAnnouncement } from "./actions";

export default async function AdminAnnouncementsPage() {
  const supabase = createClient();
  const { data: announcements } = await supabase
    .from("announcements")
    .select("*, profiles!announcements_created_by_fkey(full_name)")
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Duyurular</h1>
      <p className="mt-1 text-sm text-slate-500">Öğrencilere gönderilecek genel ve hedefli duyuruları yönet.</p>

      <form action={createAnnouncement} className="card mt-6">
        <div className="flex items-center gap-2 font-semibold text-slate-900">
          <Bell className="h-5 w-5 text-brand-600" />
          Yeni duyuru ekle
        </div>

        <div className="mt-4 space-y-4">
          <div>
            <label htmlFor="announcement-title" className="mb-2 block text-sm font-medium text-slate-700">
              Başlık
            </label>
            <input
              id="announcement-title"
              name="title"
              required
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-brand-300 focus:ring-2 focus:ring-brand-100"
            />
          </div>

          <div>
            <label htmlFor="announcement-body" className="mb-2 block text-sm font-medium text-slate-700">
              İçerik
            </label>
            <textarea
              id="announcement-body"
              name="body"
              required
              rows={5}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-brand-300 focus:ring-2 focus:ring-brand-100"
            />
          </div>
        </div>

        <button type="submit" className="btn-primary mt-4">
          Duyuruyu Yayınla
        </button>
      </form>

      <div className="mt-8 space-y-3">
        {(announcements || []).length === 0 && (
          <div className="card text-center text-sm text-slate-400">Henüz duyuru eklenmemiş.</div>
        )}

        {(announcements || []).map((announcement) => (
          <div key={announcement.id} className="card">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="font-semibold text-slate-900">{announcement.title}</h2>
                <p className="mt-1 text-xs text-slate-500">
                  {announcement.profiles?.full_name || "Yönetici"} · {new Date(announcement.created_at).toLocaleString("tr-TR", { dateStyle: "medium", timeStyle: "short" })}
                </p>
              </div>
            </div>
            <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-slate-600">{announcement.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
