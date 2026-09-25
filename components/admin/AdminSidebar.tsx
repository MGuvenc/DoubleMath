"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  LayoutDashboard,
  Users,
  Calendar,
  ClipboardList,
  BookOpen,
  ClipboardCheck,
  MessageCircle,
  Megaphone,
  FileText,
  Newspaper,
  Percent,
  ShoppingCart,
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react";

const LINKS = [
  { href: "/admin/dashboard", label: "Panel", icon: LayoutDashboard },
  { href: "/admin/students", label: "Öğrenciler", icon: Users },
  { href: "/admin/lessons", label: "Ders Programı", icon: Calendar },
  { href: "/admin/assignments", label: "Ödevler", icon: ClipboardList },
  { href: "/admin/materials", label: "Kaynaklar", icon: BookOpen },
  { href: "/admin/quizzes", label: "Sınavlar", icon: ClipboardCheck },
  { href: "/admin/questions", label: "Sorular", icon: MessageCircle },
  { href: "/admin/announcements", label: "Duyurular", icon: Megaphone },
  { href: "/admin/pages", label: "Anasayfa (CMS)", icon: FileText },
  { href: "/admin/blog", label: "Blog", icon: Newspaper },
  { href: "/admin/discounts", label: "İndirim Kodları", icon: Percent },
  { href: "/admin/orders", label: "Siparişler", icon: ShoppingCart },
  { href: "/admin/settings", label: "Ayarlar", icon: Settings },
];

export default function AdminSidebar({ adminName }: { adminName: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const navLinks = (onNavigate?: () => void) => (
    <>
      {LINKS.map((l) => {
        const active = pathname === l.href;
        return (
          <Link
            key={l.href}
            href={l.href}
            onClick={onNavigate}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
              active ? "bg-brand-50 text-brand-700" : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            <l.icon className="h-4 w-4" />
            {l.label}
          </Link>
        );
      })}
    </>
  );

  return (
    <>
      <div className="flex flex-shrink-0 items-center justify-between border-b border-slate-200 bg-white p-4 sm:hidden">
        <div>
          <p className="text-xs text-slate-500">Admin</p>
          <p className="font-semibold text-slate-900">{adminName}</p>
        </div>
        <button
          onClick={() => setMobileOpen(true)}
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
          aria-label="Menüyü aç"
        >
          <Menu className="h-6 w-6" />
        </button>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 sm:hidden">
          <div className="absolute inset-0 bg-black/30" onClick={() => setMobileOpen(false)} />
          <nav className="absolute left-0 top-0 flex h-full w-72 flex-col bg-white p-4 shadow-xl">
            <div className="mb-4 flex flex-shrink-0 items-center justify-between">
              <p className="font-semibold text-slate-900">Menü</p>
              <button
                onClick={() => setMobileOpen(false)}
                className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
                aria-label="Menüyü kapat"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 space-y-1 overflow-y-auto">
              {navLinks(() => setMobileOpen(false))}
            </div>
            <div className="flex-shrink-0 border-t border-slate-200 pt-4">
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                <LogOut className="h-4 w-4" />
                Çıkış Yap
              </button>
            </div>
          </nav>
        </div>
      )}

      <aside className="hidden w-64 flex-shrink-0 flex-col border-r border-slate-200 bg-white sm:flex">
        <div className="flex-shrink-0 p-4 pb-2">
          <p className="text-xs text-slate-500">Admin</p>
          <p className="font-semibold text-slate-900">{adminName}</p>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-2">{navLinks()}</nav>
        <div className="flex-shrink-0 border-t border-slate-200 p-4">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            <LogOut className="h-4 w-4" />
            Çıkış Yap
          </button>
        </div>
      </aside>
    </>
  );
}