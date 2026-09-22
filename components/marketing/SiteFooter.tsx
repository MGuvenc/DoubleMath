import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="border-t border-slate-200 bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-10 text-sm text-slate-600">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p>© {new Date().getFullYear()} Matematik Özel Ders. Tüm hakları saklıdır.</p>
          <div className="flex gap-6">
            <Link href="/blog" className="hover:text-brand-700">Blog</Link>
            <Link href="/pricing" className="hover:text-brand-700">Ücretlendirme</Link>
            <Link href="/contact" className="hover:text-brand-700">İletişim</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
