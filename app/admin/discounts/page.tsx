import { createAdminClient } from "@/lib/supabase/server";
import DiscountCodesManager from "@/components/admin/DiscountCodesManager";
import type { DiscountCodeRow } from "@/lib/supabase/query-types";

export default async function AdminDiscountsPage() {
  const { data: codes } = await createAdminClient()
    .from("discount_codes")
    .select("*")
    .order("created_at", { ascending: false })
    .returns<DiscountCodeRow[]>();

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">İndirim Kodları</h1>
      <p className="mt-1 text-sm text-slate-500">
        Checkout&apos;ta kullanılacak indirimleri oluştur, geçerlilik ve kullanım durumlarını yönet.
      </p>
      <div className="mt-6">
        <DiscountCodesManager codes={codes || []} />
      </div>
    </div>
  );
}