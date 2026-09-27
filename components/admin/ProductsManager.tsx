"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, EyeOff, Eye } from "lucide-react";
import { createProduct, updateProduct, toggleProductActive, deleteProduct } from "@/app/admin/pricing/actions";
import type { ProductRow } from "@/lib/supabase/query-types";

const UNIT_LABELS: Record<string, string> = {
  hourly: "/saat",
  monthly: "/ay",
  one_time: "tek seferlik",
};

export default function ProductsManager({ products }: { products: ProductRow[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ProductRow | null>(null);
  const [error, setError] = useState<string | null>(null);

  function openCreate() {
    setEditing(null);
    setError(null);
    setShowForm(true);
  }

  function openEdit(product: ProductRow) {
    setEditing(product);
    setError(null);
    setShowForm(true);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = editing
        ? await updateProduct(editing.id, formData)
        : await createProduct(formData);

      if ("error" in result) {
        setError(result.error);
        return;
      }
      setShowForm(false);
      setEditing(null);
      router.refresh();
    });
  }

  function handleToggleActive(product: ProductRow) {
    startTransition(async () => {
      await toggleProductActive(product.id, !product.is_active);
      router.refresh();
    });
  }

  function handleDelete(productId: string) {
    if (!confirm("Bu paketi tamamen silmek istediğine emin misin?")) return;
    startTransition(async () => {
      await deleteProduct(productId);
      router.refresh();
    });
  }

  return (
    <div>
      <div className="flex justify-end">
        <button onClick={openCreate} className="btn-primary inline-flex items-center gap-2">
          <Plus className="h-4 w-4" /> Yeni Paket Ekle
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="card mt-4 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="label">Paket Adı *</label>
            <input name="name" required defaultValue={editing?.name} className="input" />
          </div>

          {!editing && (
            <div>
              <label className="label">Tür</label>
              <select name="type" defaultValue="lesson_package" className="input">
                <option value="lesson_package">Ders Paketi</option>
                <option value="book">Kitap</option>
                <option value="other">Diğer</option>
              </select>
            </div>
          )}

          <div>
            <label className="label">Fiyat (TL) *</label>
            <input
              type="number"
              name="price"
              step="0.01"
              min="0"
              required
              defaultValue={editing?.price}
              className="input"
            />
          </div>

          <div>
            <label className="label">Fiyat Birimi</label>
            <select name="pricing_unit" defaultValue={editing?.pricing_unit || "monthly"} className="input">
              <option value="hourly">Saatlik (/saat)</option>
              <option value="monthly">Aylık (/ay)</option>
              <option value="one_time">Tek Seferlik</option>
            </select>
          </div>

          <div>
            <label className="label">Toplam Ders Saati</label>
            <input
              type="number"
              name="lesson_count"
              min="0"
              defaultValue={editing?.lesson_count ?? ""}
              placeholder="Örn: 35"
              className="input"
            />
          </div>

          <div>
            <label className="label">Süre (ay)</label>
            <input
              type="number"
              name="duration_months"
              min="0"
              defaultValue={editing?.duration_months ?? ""}
              placeholder="Örn: 6"
              className="input"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="label">Kısa Açıklama</label>
            <input name="description" defaultValue={editing?.description || ""} className="input" />
          </div>

          <div className="sm:col-span-2">
            <label className="label">Özellikler (her satır bir madde)</label>
            <textarea
              name="features"
              defaultValue={editing?.features || ""}
              rows={5}
              placeholder={"Haftalık takip\nRehberlik programı\nDers süresi 60 dk\n..."}
              className="input"
            />
          </div>

          {error && <p className="text-sm text-red-600 sm:col-span-2">{error}</p>}

          <div className="flex gap-3 sm:col-span-2">
            <button type="submit" disabled={isPending} className="btn-primary">
              {isPending ? "Kaydediliyor..." : editing ? "Güncelle" : "Oluştur"}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">
              Vazgeç
            </button>
          </div>
        </form>
      )}

      <div className="mt-6 space-y-3">
        {products.length === 0 && (
          <div className="card text-center text-sm text-slate-400">Henüz paket eklenmedi.</div>
        )}
        {products.map((p) => (
          <div key={p.id} className="card">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-slate-900">{p.name}</p>
                  {!p.is_active && (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                      Pasif
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-slate-600">
                  {p.price.toLocaleString("tr-TR")} TL {UNIT_LABELS[p.pricing_unit]}
                  {p.lesson_count ? ` — ${p.lesson_count} saat` : ""}
                  {p.duration_months ? ` — ${p.duration_months} ay` : ""}
                </p>
                {p.description && <p className="mt-1 text-sm text-slate-500">{p.description}</p>}
              </div>
              <div className="flex flex-shrink-0 items-center gap-3">
                <button onClick={() => openEdit(p)} title="Düzenle">
                  <Pencil className="h-4 w-4 text-slate-400 hover:text-brand-600" />
                </button>
                <button onClick={() => handleToggleActive(p)} title={p.is_active ? "Pasifleştir" : "Aktifleştir"}>
                  {p.is_active ? (
                    <EyeOff className="h-4 w-4 text-slate-400 hover:text-amber-600" />
                  ) : (
                    <Eye className="h-4 w-4 text-slate-400 hover:text-green-600" />
                  )}
                </button>
                <button onClick={() => handleDelete(p.id)} title="Sil">
                  <Trash2 className="h-4 w-4 text-slate-400 hover:text-red-600" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}