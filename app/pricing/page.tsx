import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import SiteHeader from "@/components/marketing/SiteHeader";
import SiteFooter from "@/components/marketing/SiteFooter";
import type { ProductRow } from "@/lib/supabase/query-types";

export const metadata: Metadata = {
  title: "Ücretlendirme",
  description: "Matematik özel ders paketleri ve fiyatlandırma.",
};

const UNIT_LABELS: Record<string, string> = {
  hourly: "/saat",
  monthly: "/ay",
  one_time: "tek seferlik",
};

export default async function PricingPage() {
  const supabase = createClient();

  const { data: products } = await supabase
    .from("products")
    .select("*")
    .eq("is_active", true)
    .eq("type", "lesson_package")
    .order("sort_order", { ascending: true })
    .order("price", { ascending: true })
    .returns<ProductRow[]>();

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-16">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">Ücretlendirme</h1>
          <p className="mt-3 text-slate-600">İhtiyacına en uygun ders paketini seç.</p>
        </div>

        {!products?.length ? (
          <div className="card mx-auto mt-12 max-w-md text-center text-slate-500">
            Şu an aktif bir paket yok. Detaylı bilgi için iletişime geç.
          </div>
        ) : (
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((p) => (
              <div key={p.id} className="card flex flex-col">
                <h2 className="text-lg font-bold text-slate-900">{p.name}</h2>
                {p.description && <p className="mt-1 text-sm text-slate-500">{p.description}</p>}

                <div className="mt-4">
                  <span className="text-3xl font-bold text-brand-700">
                    {p.price.toLocaleString("tr-TR")} TL
                  </span>
                  <span className="text-sm text-slate-500"> {UNIT_LABELS[p.pricing_unit]}</span>
                </div>

                <div className="mt-2 space-y-0.5 text-sm text-slate-500">
                  {p.lesson_count && <p>{p.lesson_count} saat ders</p>}
                  {p.duration_months && <p>Ortalama {p.duration_months} ay</p>}
                </div>

                {p.features && (
                  <ul className="mt-6 flex-1 space-y-2.5">
                    {p.features
                      .split("\n")
                      .map((f) => f.trim())
                      .filter(Boolean)
                      .map((feature) => (
                        <li key={feature} className="flex items-start gap-2 text-sm text-slate-700">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-brand-600" />
                          {feature}
                        </li>
                      ))}
                  </ul>
                )}

                <Link
                  href={`/contact?package=${encodeURIComponent(p.name)}`}
                  className="btn-primary mt-6 text-center"
                >
                  Bu Paketi İste
                </Link>
              </div>
            ))}
          </div>
        )}

        <div className="card mx-auto mt-12 max-w-2xl text-center">
          <h2 className="text-xl font-bold text-slate-900">İhtiyacına Uygun Paket Bulamadın mı?</h2>
          <p className="mt-2 text-slate-600">
            Sana özel, kişiselleştirilmiş bir ders paketi oluşturabiliriz.
          </p>
          <Link href="/contact" className="btn-secondary mt-6 inline-flex">
            Kişiye Özel Paket Talep Et
          </Link>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}