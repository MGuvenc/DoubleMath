import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { CheckCircle2, Calendar, MessageCircle, TrendingUp, Sparkles } from "lucide-react";
import SiteHeader from "@/components/marketing/SiteHeader";
import SiteFooter from "@/components/marketing/SiteFooter";
import BlogSections from "@/components/marketing/BlogSections";
import type { Metadata } from "next";
import type { HomeContentJson } from "@/lib/supabase/query-types";

export const revalidate = 60; // Sayfa içeriği saatte bir temizlenir

const DEFAULT_CONTENT: HomeContentJson = {
  hero: {
    title: "Matematikte Fark Yaratan Birebir Özel Ders",
    subtitle:
      "LGS, YKS ve okul müfredatına yönelik, deneyimli öğretmenle online birebir matematik dersleri.",
  },
  features: [
    { title: "Esnek Ders Programı", description: "Sana uygun gün ve saatte, düzenli online ders takvimi." },
    { title: "İlerleme Takibi", description: "Her konudaki gelişimin şeffaf şekilde panelde raporlanır." },
    { title: "Öğretmene Sor", description: "Takıldığın soruları istediğin an öğretmenine iletebilirsin." },
  ],
  whyUs: [
    "Yıllardır LGS ve YKS matematik alanında öğrenci yetiştiren deneyim",
    "Her öğrenciye özel çalışma planı ve haftalık ilerleme raporu",
    "Ödevler, sınavlar ve takip sistemiyle disiplinli çalışma alışkanlığı",
    "Veli ile düzenli iletişim ve şeffaf sonuç takibi",
  ],
  cta: {
    title: "Hazırsan İlk Adımı Birlikte Atalım",
    subtitle: "İletişim formunu doldur, sana en kısa sürede dönüş yapalım.",
  },
};

const FEATURE_ICONS = [Calendar, TrendingUp, MessageCircle, Sparkles];

export async function generateMetadata(): Promise<Metadata> {
  const supabase = createClient();
  const { data: page } = await supabase
    .from("pages")
    .select("seo_title, seo_description")
    .eq("slug", "home")
    .eq("status", "published")
    .single<{ seo_title: string | null; seo_description: string | null }>();

  return {
    title: page?.seo_title || undefined,
    description: page?.seo_description || undefined,
  };
}

export default async function HomePage() {
  const supabase = createClient();
  const { data: page } = await supabase
    .from("pages")
    .select("content_json")
    .eq("slug", "home")
    .eq("status", "published")
    .single<{ content_json: HomeContentJson }>();

  const content: HomeContentJson = { ...DEFAULT_CONTENT, ...(page?.content_json || {}) };
  const hero = content.hero || DEFAULT_CONTENT.hero!;
  const features = content.features?.length ? content.features : DEFAULT_CONTENT.features!;
  const whyUs = content.whyUs?.length ? content.whyUs : DEFAULT_CONTENT.whyUs!;
  const cta = content.cta || DEFAULT_CONTENT.cta!;

  return (
    <>
      <SiteHeader />
      <main>
        <section className="bg-gradient-to-b from-brand-50 to-white">
          <div className="mx-auto max-w-6xl px-4 py-20 text-center sm:py-28">
            <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
              {hero.title}
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-600">{hero.subtitle}</p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Link href="/contact" className="btn-primary">
                Ücretsiz Ön Görüşme Talep Et
              </Link>
              <Link href="/pricing" className="btn-secondary">
                Fiyatları İncele
              </Link>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-20">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => {
              const Icon = FEATURE_ICONS[i % FEATURE_ICONS.length];
              return (
                <div key={f.title} className="card text-center">
                  <Icon className="mx-auto h-10 w-10 text-brand-600" />
                  <h3 className="mt-4 text-lg font-semibold">{f.title}</h3>
                  <p className="mt-2 text-sm text-slate-600">{f.description}</p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="bg-slate-50 py-20">
          <div className="mx-auto max-w-4xl px-4">
            <h2 className="text-center text-3xl font-bold text-slate-900">
              Neden Bizimle Çalışmalısın?
            </h2>
            <ul className="mt-10 space-y-4">
              {whyUs.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-brand-600" />
                  <span className="text-slate-700">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <BlogSections />

        <section className="mx-auto max-w-4xl px-4 py-20 text-center">
          <h2 className="text-3xl font-bold text-slate-900">{cta.title}</h2>
          <p className="mt-4 text-slate-600">{cta.subtitle}</p>
          <Link href="/contact" className="btn-primary mt-8 inline-flex">
            Hemen İletişime Geç
          </Link>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}