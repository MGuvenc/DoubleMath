import Link from "next/link";

const NAV_LINKS = [
  { href: "/", label: "Anasayfa" },
  { href: "/pricing", label: "Ücretlendirme" },
  { href: "/blog", label: "Blog" },
  { href: "/instagram", label: "Instagram" },
  { href: "/contact", label: "İletişim" },
];

export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" className="text-lg font-bold text-brand-700">
          DoubleMath
        </Link>
        <nav className="hidden gap-6 sm:flex">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-sm font-medium text-slate-600 hover:text-brand-700"
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm font-medium text-slate-600 hover:text-brand-700">
            Giriş Yap
          </Link>
          <Link href="/contact" className="btn-primary !px-4 !py-2 text-sm">
            Ders Al
          </Link>
        </div>
      </div>
    </header>
  );
}
