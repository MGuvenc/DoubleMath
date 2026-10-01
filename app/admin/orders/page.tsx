import { createAdminClient } from "@/lib/supabase/server";
import OrdersManager from "@/components/admin/OrdersManager";
import type { AdminOrderRow } from "@/lib/supabase/query-types";

export default async function AdminOrdersPage() {
  const supabase = createAdminClient();
  const { data: orders } = await supabase
    .from("orders")
    .select("*, profiles(full_name, email)")
    .order("created_at", { ascending: false })
    .limit(200)
    .returns<AdminOrderRow[]>();

  const ordersWithReceiptUrls = await Promise.all(
    (orders || []).map(async (order) => {
      const receiptUrl = order.receipt_path
        ? (await supabase.storage.from("order-receipts").createSignedUrl(order.receipt_path, 3600)).data?.signedUrl || null
        : null;
      return { ...order, receipt_url: receiptUrl };
    })
  );

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Siparişler</h1>
      <p className="mt-1 text-sm text-slate-500">Havale dekontlarını kontrol et, ödemeleri onayla ve paketleri tanımla.</p>
      <div className="mt-6">
        <OrdersManager orders={ordersWithReceiptUrls} />
      </div>
    </div>
  );
}