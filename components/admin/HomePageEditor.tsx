"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { updateHomeContent } from "@/app/admin/pages/actions";
import type { HomeContentJson } from "@/lib/supabase/query-types";

interface PageData {
  title: string;
  content_json: HomeContentJson;
  seo_title: string | null;
  seo_description: string | null;
  status: "draft" | "published";
}

export default function HomePageEditor({ page }: { page: PageData }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [features, setFeatures] = useState(
    page.content_json.features?.length
      ? page.content_json.features
      : [{ title: "", description: "" }]
  );

  function addFeature() {
    setFeatures((prev) => [...prev, { title: "", description: "" }]);
  }

  function removeFeature(index: number) {
    setFeatures((prev) => prev.filter((_, i) => i !== index));
  }

  function updateFeature(index: number, field: "title" | "description", value: string) {
    setFeatures((prev) => prev.map((f, i) => (i === index ? { ...f, [field]: value } : f)));
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await updateHomeContent(formData);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setSuccess(true);
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="card">
        <h2 className="font-semibold text-slate-900">Hero (Üst Bölüm)</h2>
        <div className="mt-4 space-y-3">
          <div>
            <label className="label">Başlık</label>
            <input
              name="hero_title"
              defaultValue={page.content_json.hero?.title}
              className="input"
              required
            />
          </div>
          <div>
            <label className="label">Alt Başlık</label>
            <textarea
              name="hero_subtitle"
              defaultValue={page.content_json.hero?.subtitle}
              rows={2}
              className="input"
              required
            />
          </div>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">Özellik Kartları</h2>
          <button type="button" onClick={addFeature} className="btn-secondary inline-flex items-center gap-1.5 text-sm">
            <Plus className="h-4 w-4" /> Kart Ekle
          </button>
        </div>
        <div className="mt-4 space-y-4">
          {features.map((f, i) => (
            <div key={i} className="flex gap-2 rounded-lg border border-slate-200 p-3">
              <div className="flex-1 space-y-2">
                <input
                  name="feature_title"
                  value={f.title}
                  onChange={(e) => updateFeature(i, "title", e.target.value)}
                  placeholder="Kart başlığı"
                  className="input"
                />
                <input
                  name="feature_description"
                  value={f.description}
                  onChange={(e) => updateFeature(i, "description", e.target.value)}
                  placeholder="Kart açıklaması"
                  className="input"
                />
              </div>
              <button
                type="button"
                onClick={() => removeFeature(i)}
                className="flex-shrink-0 self-start p-2 text-slate-400 hover:text-red-600"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h2 className="font-semibold text-slate-900">&quot;Neden Bizimle Çalışmalısın?&quot; Listesi</h2>
        <p className="mt-1 text-xs text-slate-400">Her satıra bir madde yaz.</p>
        <textarea
          name="why_us"
          defaultValue={page.content_json.whyUs?.join("\n")}
          rows={5}
          className="input mt-3"
        />
      </div>

      <div className="card">
        <h2 className="font-semibold text-slate-900">Alt CTA Bölümü</h2>
        <div className="mt-4 space-y-3">
          <div>
            <label className="label">Başlık</label>
            <input
              name="cta_title"
              defaultValue={page.content_json.cta?.title}
              className="input"
              required
            />
          </div>
          <div>
            <label className="label">Alt Metin</label>
            <input
              name="cta_subtitle"
              defaultValue={page.content_json.cta?.subtitle}
              className="input"
              required
            />
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="font-semibold text-slate-900">SEO Ayarları</h2>
        <div className="mt-4 space-y-3">
          <div>
            <label className="label">SEO Başlığı</label>
            <input name="seo_title" defaultValue={page.seo_title || ""} className="input" />
          </div>
          <div>
            <label className="label">SEO Açıklaması</label>
            <textarea
              name="seo_description"
              defaultValue={page.seo_description || ""}
              rows={2}
              className="input"
            />
          </div>
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {success && <p className="text-sm text-green-600">Kaydedildi.</p>}

      <button type="submit" disabled={isPending} className="btn-primary">
        {isPending ? "Kaydediliyor..." : "Kaydet"}
      </button>
    </form>
  );
}