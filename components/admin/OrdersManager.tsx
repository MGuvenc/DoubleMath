"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, ExternalLink } from "lucide-react";
import { approveOrder } from "@/app/admin/orders/actions";
import type { AdminOrderRow } from "@/lib/supabase/query-types";
import MathSubmitButton from "@/components/ui/MathSubmitButton";

const STATUS_LABELS: Record<AdminOrderRow["status"], { label: string; className: string }> = {
  pending: { label: "Onay bekliyor", className: "bg-amber-50 text-amber-800" },
  paid: { label: "Ödendi", className: "bg-green-50 text-green-700" },
  failed: { label: "Başarısız", className: "bg-red-50 text-red-700" },
  refunded: { label: "İade edildi", className: "bg-slate-100 text-slate-700" },
};

export default function OrdersManager({ orders }: { orders: AdminOrderRow[] }) {
  const router = useRouter();
  const [isApproving, startApproving] = useTransition();
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  function handleApprove(orderId: string) {
    setActiveOrderId(orderId);
    setMessage(null);
    startApproving(async () => {
      const result = await approveOrder(orderId);
      if ("error" in result) {
        setMessage(result.error);
        setActiveOrderId(null);
        return;
      }
      setMessage("Ödeme onaylandı, paket öğrenci hesabına tanımlandı.");
      setActiveOrderId(null);
      router.refresh();
    });
  }

  return (
    <div>
      {message && (
        <p role="status" className={`mb-4 text-sm ${message.startsWith("Ödeme") ? "text-green-700" : "text-red-600"}`}>
          {message}
        </p>
      )}
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[850px] text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-slate-500">
              <th className="pb-3 pr-4">Öğrenci</th>
              <th className="pb-3 pr-4">Paket</th>
              <th className="pb-3 pr-4">Tutar</th>
              <th className="pb-3 pr-4">Dekont</th>
              <th className="pb-3 pr-4">Durum</th>
              <th className="pb-3 pr-4">Tarih / Bitiş</th>
              <th className="pb-3">İşlem</th>
            </tr>
          </thead>
          <tbody>
            {!orders.length && (
              <tr><td colSpan={7} className="py-8 text-center text-slate-400">Henüz sipariş yok.</td></tr>
            )}
            {orders.map((order) => {
              const status = STATUS_LABELS[order.status];
              return (
                <tr key={order.id} className="border-b border-slate-100 last:border-0">
                  <td className="py-3 pr-4">
                    <p className="font-medium text-slate-900">{order.profiles?.full_name || "Silinmiş öğrenci"}</p>
                    <p className="text-xs text-slate-500">{order.profiles?.email || "—"}</p>
                  </td>
                  <td className="py-3 pr-4 text-slate-700">
                    {order.product_name || "Ders paketi"}
                    {order.package_duration_months ? <span className="block text-xs text-slate-500">{order.package_duration_months} ay</span> : null}
                  </td>
                  <td className="py-3 pr-4 font-medium text-slate-900">
                    {Number(order.amount).toLocaleString("tr-TR")} {order.currency}
                  </td>
                  <td className="py-3 pr-4">
                    {order.receipt_url ? (
                      <a href={order.receipt_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-medium text-brand-700 hover:underline">
                        Görüntüle <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    ) : <span className="text-slate-400">Yüklenmedi</span>}
                  </td>
                  <td className="py-3 pr-4"><span className={`rounded px-2 py-1 text-xs font-medium ${status.className}`}>{status.label}</span></td>
                  <td className="py-3 pr-4 text-slate-600">
                    <p>{new Date(order.created_at).toLocaleDateString("tr-TR")}</p>
                    {order.package_expires_at && <p className="text-xs">Bitiş: {new Date(order.package_expires_at).toLocaleDateString("tr-TR")}</p>}
                  </td>
                  <td className="py-3">
                    {order.status === "pending" && order.receipt_url ? (
                      <MathSubmitButton
                        type="button"
                        onClick={() => handleApprove(order.id)}
                        loading={isApproving && activeOrderId === order.id}
                        pendingText="Onaylanıyor..."
                        className="inline-flex items-center gap-1 rounded bg-green-700 px-3 py-2 text-xs font-semibold text-white hover:bg-green-800"
                      >
                        <Check className="h-4 w-4" /> Ödendi
                      </MathSubmitButton>
                    ) : order.status === "pending" ? (
                      <span className="text-xs text-amber-700">Dekont bekleniyor</span>
                    ) : <span className="text-slate-400">—</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}