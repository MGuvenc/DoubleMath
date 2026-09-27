import { createClient } from "@/lib/supabase/server";
import ProductsManager from "@/components/admin/ProductsManager";
import type { ProductRow } from "@/lib/supabase/query-types";

export default async function AdminPricingPage() {
  const supabase = createClient();

  const { data: products } = await supabase
    .from("products")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true })
    .returns<ProductRow[]>();

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Ücretlendirme</h1>
      <p className="mt-1 text-sm text-slate-500">
        Ders paketlerini yönet — buradaki paketler /pricing sayfasında görünür.
      </p>

      <div className="mt-6">
        <ProductsManager products={products || []} />
      </div>
    </div>
  );
}