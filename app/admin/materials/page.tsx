import { createClient, createAdminClient } from "@/lib/supabase/server";
import MaterialsManager from "@/components/admin/MaterialsManager";
import type { MaterialRow } from "@/lib/supabase/query-types";

export default async function AdminMaterialsPage() {
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

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Kaynak Kütüphanesi</h1>
      <p className="mt-1 text-sm text-slate-500">
        Öğrencilerin erişebileceği PDF, video ve link materyallerini yönet.
      </p>

      <div className="mt-6">
        <MaterialsManager materials={withUrls} />
      </div>
    </div>
  );
}