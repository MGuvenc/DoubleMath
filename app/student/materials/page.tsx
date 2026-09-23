import { createClient, createAdminClient } from "@/lib/supabase/server";
import { FileText, Video, Link2 } from "lucide-react";
import type { MaterialRow } from "@/lib/supabase/query-types";

const TYPE_ICONS = { pdf: FileText, video: Video, link: Link2 };
const TYPE_LABELS = { pdf: "PDF", video: "Video", link: "Link" };

export default async function StudentMaterialsPage() {
  const supabase = createClient();
  const adminSupabase = createAdminClient();

  const { data: materials } = await supabase
    .from("materials")
    .select("*")
    .order("created_at", { ascending: false })
    .returns<MaterialRow[]>();

  const withUrls = await Promise.all(
    (materials || []).map(async (m) => ({
      ...m,
      file_path: m.file_path
        ? (await adminSupabase.storage.from("materials").createSignedUrl(m.file_path, 3600)).data?.signedUrl ||
          null
        : null,
    }))
  );

  const grouped = withUrls.reduce<Record<string, typeof withUrls>>((acc, m) => {
    const key = m.topic || "Diğer";
    (acc[key] ||= []).push(m);
    return acc;
  }, {});

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Kaynaklar</h1>
      <p className="mt-1 text-sm text-slate-500">Öğretmeninin paylaştığı PDF, video ve linkler.</p>

      <div className="mt-6 space-y-6">
        {Object.keys(grouped).length === 0 && (
          <div className="card text-center text-sm text-slate-400">Henüz paylaşılan bir kaynak yok.</div>
        )}
        {Object.entries(grouped).map(([topic, items]) => (
          <div key={topic}>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">{topic}</h2>
            <div className="mt-3 space-y-2">
              {items.map((m) => {
                const Icon = TYPE_ICONS[m.type];
                const href = m.type === "pdf" ? m.file_path : m.external_url;
                return (
                  
                    key={m.id}
                    href={href || "#"}
                    target="_blank"
                    className="card flex items-center gap-3 py-3 transition hover:border-brand-300"
                  >
                    <Icon className="h-5 w-5 flex-shrink-0 text-brand-600" />
                    <div>
                      <p className="font-medium text-slate-900">{m.title}</p>
                      {m.description && <p className="text-sm text-slate-500">{m.description}</p>}
                      <p className="text-xs text-slate-400">{TYPE_LABELS[m.type]}</p>
                    </div>
                  </a>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}