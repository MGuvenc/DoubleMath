import { createClient } from "@/lib/supabase/server";
import type { ContactRequestRow } from "@/lib/supabase/query-types";

export default async function AdminContactRequestsPage() {
  const supabase = createClient();
  const { data: requests, error } = await supabase
    .from("contact_requests")
    .select("id, full_name, email, phone, grade_level, message, is_handled, created_at")
    .order("created_at", { ascending: false })
    .returns<ContactRequestRow[]>();

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">İletişim Talepleri</h1>
      <p className="mt-1 text-sm text-slate-500">
        Web sitesindeki iletişim formundan gönderilen talepler.
      </p>

      <div className="card mt-6 overflow-x-auto">
        {error ? (
          <p className="py-6 text-center text-sm text-red-600">
            Talepler yüklenemedi. Lütfen daha sonra tekrar deneyin.
          </p>
        ) : (
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="pb-2 pr-4">Ad Soyad</th>
                <th className="pb-2 pr-4">İletişim</th>
                <th className="pb-2 pr-4">Seviye</th>
                <th className="pb-2 pr-4">Mesaj</th>
                <th className="pb-2 pr-4">Tarih</th>
                <th className="pb-2">Durum</th>
              </tr>
            </thead>
            <tbody>
              {!requests?.length && (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-400">
                    Henüz iletişim talebi yok.
                  </td>
                </tr>
              )}
              {requests?.map((request) => (
                <tr key={request.id} className="border-b border-slate-100 align-top last:border-0">
                  <td className="py-3 pr-4 font-medium text-slate-900">{request.full_name}</td>
                  <td className="space-y-1 py-3 pr-4">
                    <a className="block text-brand-700 hover:underline" href={`mailto:${request.email}`}>
                      {request.email}
                    </a>
                    {request.phone && (
                      <a className="block text-slate-600 hover:underline" href={`tel:${request.phone}`}>
                        {request.phone}
                      </a>
                    )}
                  </td>
                  <td className="py-3 pr-4 text-slate-600">{request.grade_level || "—"}</td>
                  <td className="max-w-sm whitespace-pre-wrap break-words py-3 pr-4 text-slate-600">
                    {request.message || "—"}
                  </td>
                  <td className="whitespace-nowrap py-3 pr-4 text-slate-600">
                    {new Date(request.created_at).toLocaleString("tr-TR", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </td>
                  <td className="py-3">
                    <span
                      className={
                        request.is_handled
                          ? "text-slate-500"
                          : "font-medium text-emerald-700"
                      }
                    >
                      {request.is_handled ? "İşlendi" : "Yeni"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}