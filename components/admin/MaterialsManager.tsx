"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Plus, FileText, Video, Link2, Trash2 } from "lucide-react";
import { createMaterial, deleteMaterial } from "@/app/admin/materials/actions";
import type { MaterialRow } from "@/lib/supabase/query-types";

const TYPE_ICONS = { pdf: FileText, video: Video, link: Link2 };
const TYPE_LABELS = { pdf: "PDF", video: "Video", link: "Link" };

export default function MaterialsManager({ materials }: { materials: MaterialRow[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);
  const [type, setType] = useState<"pdf" | "video" | "link">("pdf");
  const [formError, setFormError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await createMaterial(formData);
      if ("error" in result) {
        setFormError(result.error);
        return;
      }
      setShowForm(false);
      router.refresh();
    });
  }

  function handleDelete(materialId: string) {
    if (!confirm("Bu materyali silmek istediğine emin misin?")) return;
    startTransition(async () => {
      await deleteMaterial(materialId);
      router.refresh();
    });
  }

  // Konuya göre grupla
  const grouped = materials.reduce<Record<string, MaterialRow[]>>((acc, m) => {
    const key = m.topic || "Diğer";
    (acc[key] ||= []).push(m);
    return acc;
  }, {});

  return (
    <div>
      <div className="flex justify-end">
        <button onClick={() => setShowForm((v) => !v)} className="btn-primary inline-flex items-center gap-2">
          <Plus className="h-4 w-4" /> Yeni Materyal Ekle
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="card mt-4 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="label">Başlık *</label>
            <input name="title" required className="input" placeholder="Örn: Türev Konu Özeti" />
          </div>
          <div>
            <label className="label">Konu</label>
            <input name="topic" className="input" placeholder="Örn: Türev" />
          </div>
          <div>
            <label className="label">Tür *</label>
            <select
              name="type"
              value={type}
              onChange={(e) => setType(e.target.value as typeof type)}
              className="input"
            >
              <option value="pdf">PDF Dosyası</option>
              <option value="video">Video (YouTube/Vimeo linki)</option>
              <option value="link">Diğer Link</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="label">Açıklama</label>
            <textarea name="description" rows={2} className="input" />
          </div>

          {type === "pdf" ? (
            <div className="sm:col-span-2">
              <label className="label">PDF Dosyası *</label>
              <input type="file" name="file" accept="application/pdf" className="input" />
              <p className="mt-1 text-xs text-slate-400">Maksimum 50MB</p>
            </div>
          ) : (
            <div className="sm:col-span-2">
              <label className="label">{type === "video" ? "Video Linki *" : "Link *"}</label>
              <input
                type="url"
                name="external_url"
                placeholder="https://youtube.com/watch?v=..."
                className="input"
              />
            </div>
          )}

          {formError && <p className="text-sm text-red-600 sm:col-span-2">{formError}</p>}

          <div className="flex gap-3 sm:col-span-2">
            <button type="submit" disabled={isPending} className="btn-primary">
              {isPending ? "Ekleniyor..." : "Ekle"}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">
              Vazgeç
            </button>
          </div>
        </form>
      )}

      <div className="mt-6 space-y-6">
        {Object.keys(grouped).length === 0 && (
          <div className="card text-center text-sm text-slate-400">Henüz materyal eklenmedi.</div>
        )}
        {Object.entries(grouped).map(([topic, items]) => (
          <div key={topic}>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">{topic}</h2>
            <div className="mt-3 space-y-2">
              {items.map((m) => {
                const Icon = TYPE_ICONS[m.type];
                const href = m.type === "pdf" ? m.file_path : m.external_url;
                return (
                  <div key={m.id} className="card flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <Icon className="h-5 w-5 text-brand-600" />
                      <div>
                        <p className="font-medium text-slate-900">{m.title}</p>
                        <p className="text-xs text-slate-400">
                          {TYPE_LABELS[m.type]} — {format(new Date(m.created_at), "d MMM yyyy", { locale: tr })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {href && (
                        <a href={href} target="_blank" className="text-sm font-medium text-brand-600">
                          Görüntüle
                        </a>
                      )}
                      <button onClick={() => handleDelete(m.id)} title="Sil">
                        <Trash2 className="h-4 w-4 text-slate-400 hover:text-red-600" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}