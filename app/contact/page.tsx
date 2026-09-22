import type { Metadata } from "next";
import SiteHeader from "@/components/marketing/SiteHeader";
import SiteFooter from "@/components/marketing/SiteFooter";
import ContactForm from "@/components/marketing/ContactForm";

export const metadata: Metadata = {
  title: "İletişim",
  description: "Matematik özel ders almak için bize ulaşın, ücretsiz ön görüşme talep edin.",
};

export default function ContactPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-4 py-16">
        <h1 className="text-3xl font-bold text-slate-900">İletişime Geç</h1>
        <p className="mt-2 text-slate-600">
          Formu doldur, en kısa sürede sana dönüş yapalım.
        </p>
        <div className="mt-8">
          <ContactForm />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
