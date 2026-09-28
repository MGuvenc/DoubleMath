"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

const NAV_LINKS = [
  { href: "/", label: "Anasayfa" },
  { href: "/pricing", label: "Ücretlendirme" },
  { href: "/blog", label: "Blog" },
  { href: "/instagram", label: "Instagram" },
  { href: "/contact", label: "İletişim" },
];

export default function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" className="text-lg font-bold text-brand-700" onClick={() => setOpen(false)}>
          Double Matematik
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
        <div className="hidden items-center gap-3 sm:flex">
          <Link href="/login" className="text-sm font-medium text-slate-600 hover:text-brand-700">
            Giriş Yap
          </Link>
          <Link href="/contact" className="btn-primary !px-4 !py-2 text-sm">
            Ders Al
          </Link>
        </div>

        <button
          onClick={() => setOpen((v) => !v)}
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 sm:hidden"
          aria-label={open ? "Menüyü kapat" : "Menüyü aç"}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <nav className="border-t border-slate-200 bg-white px-4 py-3 sm:hidden">
          <div className="flex flex-col gap-1">
            {NAV_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                {l.label}
              </Link>
            ))}
            <div className="mt-2 flex flex-col gap-2 border-t border-slate-200 pt-3">
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Giriş Yap
              </Link>
              <Link
                href="/contact"
                onClick={() => setOpen(false)}
                className="btn-primary text-center text-sm"
              >
                Ders Al
              </Link>
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}