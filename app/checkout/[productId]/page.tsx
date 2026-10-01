import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import BankTransferCheckout from "@/components/marketing/BankTransferCheckout";
import type { ProductRow } from "@/lib/supabase/query-types";

export default async function CheckoutPage({ params }: { params: { productId: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(`/login?redirect=${encodeURIComponent(`/checkout/${params.productId}`)}`);

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single<{ role: string }>();
  if (profile?.role !== "student") redirect("/student/dashboard");

  const { data: product } = await supabase
    .from("products")
    .select("*")
    .eq("id", params.productId)
    .eq("type", "lesson_package")
    .eq("is_active", true)
    .single<ProductRow>();
  if (!product) notFound();

  const adminSupabase = createAdminClient();
  const { data: bankRows } = await adminSupabase
    .from("site_settings")
    .select("key, value")
    .in("key", ["bank_name", "bank_account_holder", "bank_iban"])
    .returns<{ key: string; value: string | null }[]>();
  const bankSettings = new Map((bankRows || []).map((row) => [row.key, row.value || ""]));
  const bankName = bankSettings.get("bank_name") || "";
  const accountHolder = bankSettings.get("bank_account_holder") || "";
  const iban = bankSettings.get("bank_iban") || "";

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:py-16">
      <Link href="/pricing" className="text-sm font-medium text-brand-700 hover:underline">← Paketlere dön</Link>
      <div className="mt-6">
        <p className="text-sm font-medium text-brand-700">Havale/EFT ile ödeme</p>
        <h1 className="mt-1 text-3xl font-bold text-slate-900">{product.name}</h1>
        <p className="mt-3 text-2xl font-bold text-slate-900">
          {product.price.toLocaleString("tr-TR")} TL
        </p>
        {product.duration_months && (
          <p className="mt-1 text-sm text-slate-600">Paket süresi: {product.duration_months} ay, ödeme onayından itibaren</p>
        )}
      </div>

      {bankName && accountHolder && /^TR\d{24}$/.test(iban) ? (
        <div className="mt-8">
          <BankTransferCheckout
            productId={product.id}
            bankName={bankName}
            accountHolder={accountHolder}
            iban={iban}
          />
        </div>
      ) : (
        <div className="card mt-8 border border-amber-200 bg-amber-50 text-sm text-amber-900">
          Havale bilgileri henüz tanımlanmamış. Lütfen daha sonra tekrar dene veya bizimle iletişime geç.
        </div>
      )}
    </main>
  );
}