import { createClient } from "@/lib/supabase/server";
import { Bell, CheckCheck } from "lucide-react";
import { markNotificationAsRead } from "./actions";
import MathSubmitButton from "@/components/ui/MathSubmitButton";

export default async function StudentNotificationsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: notifications } = await supabase
    .from("notifications")
    .select("*")
    .eq("recipient_id", user.id)
    .order("created_at", { ascending: false });

  await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("recipient_id", user.id)
    .eq("is_read", false);

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Bildirimler</h1>
      <p className="mt-1 text-sm text-slate-500">Sınav, duyuru, ödev ve soru akışına dair güncellemeler.</p>

      <div className="mt-6 space-y-3">
        {(notifications || []).length === 0 && (
          <div className="card text-center text-sm text-slate-400">Henüz bildirimin yok.</div>
        )}

        {(notifications || []).map((notification) => (
          <div key={notification.id} className={`card ${notification.is_read ? "opacity-80" : "border-brand-200 bg-brand-50/40"}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-white p-2 text-brand-600 shadow-sm">
                  <Bell className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="font-semibold text-slate-900">{notification.title}</h2>
                  <p className="mt-1 text-sm text-slate-600">{notification.body}</p>
                  <p className="mt-2 text-[11px] text-slate-500">
                    {new Date(notification.created_at).toLocaleString("tr-TR", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </p>
                </div>
              </div>

              {!notification.is_read && (
                <form action={markNotificationAsRead}>
                  <input type="hidden" name="notification_id" value={notification.id} />
                  <MathSubmitButton className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-1 text-xs font-medium text-brand-700 shadow-sm" pendingText="Güncelleniyor...">
                    <CheckCheck className="h-3.5 w-3.5" />
                    Okundu
                  </MathSubmitButton>
                </form>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
