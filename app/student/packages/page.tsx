import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { StudentOrderRow } from "@/lib/supabase/query-types";
import { hasPackageAccess, PACKAGE_ACCESS_GRACE_DAYS } from "@/lib/package-access";

const STATUS_LABELS: Record<StudentOrderRow["status"], string> = {
  pending: "Ödeme onayı bekliyor",
  paid: "Ödendi",
  failed: "Ödeme başarısız",
  refunded: "İade edildi",
};

export default async function StudentPackagesPage({
  searchParams,
}: {
  searchParams: { orderSubmitted?: string; access?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: orders } = await supabase
    .from("orders")
    .select("id, product_name, package_duration_months, amount, currency, status, paid_at, package_expires_at, created_at")
    .eq("student_id", user!.id)
    .order("created_at", { ascending: false })
    .returns<StudentOrderRow[]>();

  const now = Date.now();
  const activeOrder = (orders || []).find(
    (order) => order.status === "paid" && hasPackageAccess(order.package_expires_at, now)
  );
  const packageIsActive = activeOrder?.package_expires_at
    ? new Date(activeOrder.package_expires_at).getTime() > now
    : Boolean(activeOrder);
  const pendingOrder = !activeOrder ? (orders || []).find((order) => order.status === "pending") : null;

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Paketlerim</h1>
      <p className="mt-1 text-sm text-slate-500">Aktif paketini ve tüm ödeme kayıtlarını burada görebilirsin.</p>

      {searchParams.orderSubmitted === "1" && (
        <p role="status" className="mt-5 rounded border border-green-200 bg-green-50 p-3 text-sm text-green-800">
          Dekontun alındı. Ödeme kontrol edilince paket hesabına tanımlanacak.
        </p>
      )}

      {searchParams.access === "required" && (
        <p role="alert" className="mt-5 rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          Diğer ekranları görüntülemek için bir ders paketi satın alman gerekiyor. Paket süresi bittikten sonra 3 gün boyunca erişimin devam eder.
        </p>
      )}

      <section className="card mt-6">
        <h2 className="font-semibold text-slate-900">Şu anki durum</h2>
        {activeOrder ? (
          <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-lg font-bold text-slate-900">{activeOrder.product_name || "Ders paketi"}</p>
              <p className={`mt-1 text-sm ${packageIsActive ? "text-green-700" : "text-amber-700"}`}>
                {packageIsActive ? "Aktif paket" : "3 günlük ek erişim süresi"}
              </p>
            </div>
            <p className="text-sm text-slate-600">
              {activeOrder.package_expires_at
                ? packageIsActive
                  ? `Bitiş tarihi: ${new Date(activeOrder.package_expires_at).toLocaleDateString("tr-TR")}`
                  : `Ek erişim ${new Date(new Date(activeOrder.package_expires_at).getTime() + PACKAGE_ACCESS_GRACE_DAYS * 24 * 60 * 60 * 1000).toLocaleDateString("tr-TR")} tarihinde sona eriyor`
                : "Süre sınırı yok"}
            </p>
          </div>
        ) : pendingOrder ? (
          <div className="mt-3">
            <p className="font-semibold text-slate-900">{pendingOrder.product_name || "Ders paketi"}</p>
            <p className="mt-1 text-sm text-amber-700">Dekont kontrolü bekleniyor.</p>
          </div>
        ) : (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-600">Şu anda aktif bir paketin yok.</p>
            <Link href="/pricing" className="btn-primary">Paketleri Gör</Link>
          </div>
        )}
      </section>

      <section className="mt-8">
        <h2 className="font-semibold text-slate-900">Satın alma geçmişi</h2>
        <div className="card mt-3 overflow-x-auto">
          <table className="w-full min-w-[600px] text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="pb-3 pr-4">Paket</th>
                <th className="pb-3 pr-4">Tutar</th>
                <th className="pb-3 pr-4">Durum</th>
                <th className="pb-3 pr-4">Satın alma</th>
                <th className="pb-3">Bitiş</th>
              </tr>
            </thead>
            <tbody>
              {!orders?.length && (
                <tr><td colSpan={5} className="py-8 text-center text-slate-400">Henüz satın alma kaydın yok.</td></tr>
              )}
              {orders?.map((order) => (
                <tr key={order.id} className="border-b border-slate-100 last:border-0">
                  <td className="py-3 pr-4 font-medium text-slate-900">{order.product_name || "Ders paketi"}</td>
                  <td className="py-3 pr-4 text-slate-700">{Number(order.amount).toLocaleString("tr-TR")} {order.currency}</td>
                  <td className="py-3 pr-4 text-slate-700">{STATUS_LABELS[order.status]}</td>
                  <td className="py-3 pr-4 text-slate-600">{new Date(order.paid_at || order.created_at).toLocaleDateString("tr-TR")}</td>
                  <td className="py-3 text-slate-600">
                    {order.package_expires_at ? new Date(order.package_expires_at).toLocaleDateString("tr-TR") : order.status === "paid" ? "Sınırsız" : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}