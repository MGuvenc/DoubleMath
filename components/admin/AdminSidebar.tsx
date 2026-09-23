"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  LayoutDashboard,
  Users,
  Calendar,
  ClipboardList,
  BookOpen,
  MessageCircle,
  Megaphone,
  FileText,
  Newspaper,
  Percent,
  ShoppingCart,
  Settings,
  LogOut,
} from "lucide-react";

const LINKS = [
  { href: "/admin/dashboard", label: "Panel", icon: LayoutDashboard },
  { href: "/admin/students", label: "Öğrenciler", icon: Users },
  { href: "/admin/lessons", label: "Ders Programı", icon: Calendar },
  { href: "/admin/assignments", label: "Ödevler", icon: ClipboardList },
  { href: "/admin/materials", label: "Kaynaklar", icon: BookOpen },
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

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="hidden w-64 flex-col overflow-y-auto border-r border-slate-200 bg-white p-4 sm:flex">
      <div className="mb-6 px-2">
        <p className="text-xs text-slate-500">Admin</p>
        <p className="font-semibold text-slate-900">{adminName}</p>
      </div>
      <nav className="flex-1 space-y-1">
        {LINKS.map((l) => {
          const active = pathname === l.href;
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                active ? "bg-brand-50 text-brand-700" : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <l.icon className="h-4 w-4" />
              {l.label}
            </Link>
          );
        })}
      </nav>
      <button
        onClick={handleLogout}
        className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
      >
        <LogOut className="h-4 w-4" />
        Çıkış Yap
      </button>
    </aside>
  );
}
