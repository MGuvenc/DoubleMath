"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Pencil, Plus, Save, X } from "lucide-react";
import {
  createDiscountCode,
  toggleDiscountCode,
  updateDiscountCode,
} from "@/app/admin/discounts/actions";
import type { DiscountCodeRow } from "@/lib/supabase/query-types";
import MathSubmitButton from "@/components/ui/MathSubmitButton";

function formatIstanbulDate(value: string) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Istanbul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(value));
  const part = (type: string) => parts.find((item) => item.type === type)?.value || "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

function getStatus(code: DiscountCodeRow) {
  const now = Date.now();
  if (!code.is_active) return { label: "Pasif", className: "bg-slate-100 text-slate-600" };
  if (new Date(code.valid_from).getTime() > now) return { label: "Zamanlanmış", className: "bg-blue-50 text-blue-700" };
  if (code.valid_until && new Date(code.valid_until).getTime() < now) {
    return { label: "Süresi doldu", className: "bg-amber-50 text-amber-800" };
  }
  if (code.max_uses !== null && code.used_count >= code.max_uses) {
    return { label: "Limit doldu", className: "bg-rose-50 text-rose-700" };
  }
  return { label: "Aktif", className: "bg-green-50 text-green-700" };
}

export default function DiscountCodesManager({ codes }: { codes: DiscountCodeRow[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<DiscountCodeRow | null>(null);
  const [discountType, setDiscountType] = useState<"percent" | "fixed">("percent");
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);

  function openCreate() {
    setEditing(null);
    setDiscountType("percent");
    setMessage(null);
    setShowForm(true);
  }

  function openEdit(code: DiscountCodeRow) {
    setEditing(code);
    setDiscountType(code.discount_type);
    setMessage(null);
    setShowForm(true);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = editing
        ? await updateDiscountCode(editing.id, formData)
        : await createDiscountCode(formData);
      if ("error" in result) {
        setMessage({ text: result.error, isError: true });
        return;
      }
      setShowForm(false);
      setEditing(null);
      setMessage({ text: "İndirim kodu kaydedildi.", isError: false });
      router.refresh();
    });
  }

  function handleToggle(code: DiscountCodeRow) {
    setMessage(null);
    startTransition(async () => {
      const result = await toggleDiscountCode(code.id, !code.is_active);
      if ("error" in result) {
        setMessage({ text: result.error, isError: true });
        return;
      }
      setMessage({ text: code.is_active ? "Kod pasife alındı." : "Kod etkinleştirildi.", isError: false });
      router.refresh();
    });
  }

  return (
    <div>
      <div className="flex justify-end">
        <button onClick={openCreate} className="btn-primary inline-flex items-center gap-2">
          <Plus className="h-4 w-4" /> Yeni Kod
        </button>
      </div>

      {message && (
        <p role={message.isError ? "alert" : "status"} className={`mt-4 text-sm ${message.isError ? "text-red-600" : "text-green-700"}`}>
          {message.text}
        </p>
      )}

      {showForm && (
        <form key={editing?.id || "new-discount"} onSubmit={handleSubmit} className="card mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="discount-code">Kod</label>
            <input
              id="discount-code"
              name="code"
              required
              maxLength={32}
              defaultValue={editing?.code || ""}
              className="input uppercase"
              placeholder="HOSGELDIN10"
            />
          </div>
          <div>
            <label className="label" htmlFor="discount-type">İndirim türü</label>
            <select
              id="discount-type"
              name="discount_type"
              value={discountType}
              onChange={(event) => setDiscountType(event.target.value as "percent" | "fixed")}
              className="input"
            >
              <option value="percent">Yüzde</option>
              <option value="fixed">Sabit tutar (TL)</option>
            </select>
          </div>
          <div>
            <label className="label" htmlFor="discount-amount">İndirim miktarı</label>
            <input
              id="discount-amount"
              name="amount"
              type="number"
              min="0.01"
              step="0.01"
              max={discountType === "percent" ? 100 : undefined}
              required
              defaultValue={editing?.amount ?? ""}
              className="input"
            />
          </div>
          <div>
            <label className="label" htmlFor="discount-max-uses">Toplam kullanım limiti</label>
            <input
              id="discount-max-uses"
              name="max_uses"
              type="number"
              min={editing?.used_count ? editing.used_count + 1 : 1}
              step="1"
              defaultValue={editing?.max_uses ?? ""}
              className="input"
              placeholder="Boş bırakılırsa limitsiz"
            />
          </div>
          <div>
            <label className="label" htmlFor="discount-valid-from">Başlangıç tarihi</label>
            <input
              id="discount-valid-from"
              name="valid_from"
              type="date"
              required
              defaultValue={editing ? formatIstanbulDate(editing.valid_from) : formatIstanbulDate(new Date().toISOString())}
              className="input"
            />
          </div>
          <div>
            <label className="label" htmlFor="discount-valid-until">Bitiş tarihi</label>
            <input
              id="discount-valid-until"
              name="valid_until"
              type="date"
              defaultValue={editing?.valid_until ? formatIstanbulDate(editing.valid_until) : ""}
              className="input"
            />
          </div>
          <div className="flex flex-wrap gap-2 sm:col-span-2">
            <MathSubmitButton
              type="submit"
              loading={isPending}
              pendingText="Kaydediliyor..."
              className="btn-primary inline-flex items-center gap-2"
            >
              <Save className="h-4 w-4" /> Kaydet
            </MathSubmitButton>
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary inline-flex items-center gap-2">
              <X className="h-4 w-4" /> İptal
            </button>
          </div>
        </form>
      )}

      <div className="card mt-4 overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-slate-500">
              <th className="pb-3 pr-4">Kod</th>
              <th className="pb-3 pr-4">İndirim</th>
              <th className="pb-3 pr-4">Kullanım</th>
              <th className="pb-3 pr-4">Geçerlilik</th>
              <th className="pb-3 pr-4">Durum</th>
              <th className="pb-3">İşlem</th>
            </tr>
          </thead>
          <tbody>
            {!codes.length && <tr><td colSpan={6} className="py-8 text-center text-slate-400">Henüz indirim kodu yok.</td></tr>}
            {codes.map((code) => {
              const status = getStatus(code);
              return (
                <tr key={code.id} className="border-b border-slate-100 last:border-0">
                  <td className="py-3 pr-4 font-mono font-semibold text-slate-900">{code.code}</td>
                  <td className="py-3 pr-4 text-slate-700">
                    {code.discount_type === "percent" ? `%${code.amount}` : `${Number(code.amount).toLocaleString("tr-TR")} TL`}
                  </td>
                  <td className="py-3 pr-4 text-slate-700">
                    {code.used_count} / {code.max_uses ?? "∞"}
                  </td>
                  <td className="py-3 pr-4 text-slate-600">
                    {new Date(code.valid_from).toLocaleDateString("tr-TR")}
                    {code.valid_until ? ` – ${new Date(code.valid_until).toLocaleDateString("tr-TR")}` : " – Süresiz"}
                  </td>
                  <td className="py-3 pr-4"><span className={`rounded px-2 py-1 text-xs font-medium ${status.className}`}>{status.label}</span></td>
                  <td className="py-3">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openEdit(code)}
                        className="rounded p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                        title="Kodu düzenle"
                        aria-label={`${code.code} kodunu düzenle`}
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggle(code)}
                        disabled={isPending}
                        className="rounded p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50"
                        title={code.is_active ? "Kodu pasife al" : "Kodu etkinleştir"}
                        aria-label={code.is_active ? `${code.code} kodunu pasife al` : `${code.code} kodunu etkinleştir`}
                      >
                        {code.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
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