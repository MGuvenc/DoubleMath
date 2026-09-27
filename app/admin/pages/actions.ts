"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { HomeContentJson } from "@/lib/supabase/query-types";

export type PageActionResult = { error: string } | { success: true };

const DEFAULT_HOME_CONTENT: HomeContentJson = {
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

export async function getHomePageForEditing() {
  const supabase = createClient();
  const { data } = await supabase
    .from("pages")
    .select("*")
    .eq("slug", "home")
    .maybeSingle<{
      id: string;
      title: string;
      content_json: HomeContentJson;
      seo_title: string | null;
      seo_description: string | null;
      status: "draft" | "published";
    }>();

  if (!data) {
    return {
      title: "Anasayfa",
      content_json: DEFAULT_HOME_CONTENT,
      seo_title: null,
      seo_description: null,
      status: "draft" as const,
    };
  }

  return {
    ...data,
    content_json: { ...DEFAULT_HOME_CONTENT, ...data.content_json },
  };
}

export async function updateHomeContent(formData: FormData): Promise<PageActionResult> {
  const supabase = createClient();

  const seoTitle = (formData.get("seo_title") as string) || null;
  const seoDescription = (formData.get("seo_description") as string) || null;

  const heroTitle = formData.get("hero_title") as string;
  const heroSubtitle = formData.get("hero_subtitle") as string;

  const featureTitles = formData.getAll("feature_title") as string[];
  const featureDescriptions = formData.getAll("feature_description") as string[];
  const features = featureTitles
    .map((title, i) => ({ title, description: featureDescriptions[i] || "" }))
    .filter((f) => f.title.trim() !== "");

  const whyUsRaw = (formData.get("why_us") as string) || "";
  const whyUs = whyUsRaw
    .split("\n")
    .map((s) => s.trim())
    .filter((s) => s !== "");

  const ctaTitle = formData.get("cta_title") as string;
  const ctaSubtitle = formData.get("cta_subtitle") as string;

  const content_json: HomeContentJson = {
    hero: { title: heroTitle, subtitle: heroSubtitle },
    features,
    whyUs,
    cta: { title: ctaTitle, subtitle: ctaSubtitle },
  };

  const { data: existing } = await supabase
    .from("pages")
    .select("id")
    .eq("slug", "home")
    .maybeSingle<{ id: string }>();

  const payload = {
    slug: "home",
    title: "Anasayfa",
    content_json,
    seo_title: seoTitle,
    seo_description: seoDescription,
    status: "published" as const,
  };

  const { error } = existing
    ? await supabase.from("pages").update(payload).eq("id", existing.id)
    : await supabase.from("pages").insert(payload);

  if (error) {
    console.error("Anasayfa güncellenemedi:", error);
    return { error: `Kaydedilemedi: ${error.message}` };
  }

  revalidatePath("/");
  revalidatePath("/admin/pages");
  return { success: true };
}