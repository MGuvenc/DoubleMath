"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  LayoutDashboard,
  Calendar,
  TrendingUp,
  MessageCircle,
  ClipboardList,
  BookOpen,
  ClipboardCheck,
  Bell,
  Package,
  Video,
  LogOut,
  Menu,
  X,
} from "lucide-react";

const LINKS = [
  { href: "/student/dashboard", label: "Panel", icon: LayoutDashboard },
  { href: "/student/lessons", label: "Derslerim", icon: Calendar },
  { href: "/student/progress", label: "İlerlemem", icon: TrendingUp },
  { href: "/student/assignments", label: "Ödevlerim", icon: ClipboardList },
  { href: "/student/materials", label: "Kaynaklar", icon: BookOpen },
  { href: "/student/quizzes", label: "Sınavlar", icon: ClipboardCheck },
  { href: "/student/questions", label: "Öğretmene Sor", icon: MessageCircle },
  { href: "/student/packages", label: "Paketlerim", icon: Package },
  { href: "/student/live", label: "Canlı Dersler", icon: Video },
  { href: "/student/announcements", label: "Duyurular", icon: Bell },
];

export default function StudentSidebar({ studentName, unreadCounts }: { studentName: string; unreadCounts: Record<string, number> }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const refreshCounts = () => router.refresh();
    const intervalId = window.setInterval(refreshCounts, 15000);
    window.addEventListener("focus", refreshCounts);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", refreshCounts);
    };
  }, [router]);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  async function handleLinkClick(
    event: React.MouseEvent<HTMLAnchorElement>,
    href: string,
    onNavigate?: () => void
  ) {
    const unreadCount = unreadCounts[href] || 0;
    if (unreadCount === 0 || href === "/student/announcements") {
      onNavigate?.();
      return;
    }

    event.preventDefault();
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("recipient_id", user.id)
        .eq("link", href)
        .eq("is_read", false);
    }

    onNavigate?.();
    router.push(href);
    router.refresh();
  }

  const navLinks = (onNavigate?: () => void) => (
    <>
      {LINKS.map((l) => {
        const active = pathname === l.href;
        const unreadCount = unreadCounts[l.href] || 0;
        return (
          <Link
            key={l.href}
            href={l.href}
            onClick={(event) => handleLinkClick(event, l.href, onNavigate)}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
              active ? "bg-brand-50 text-brand-700" : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            <l.icon className="h-4 w-4" />
            <span className="flex-1">{l.label}</span>
            {unreadCount > 0 && (
              <span className="inline-flex min-w-[1.5rem] items-center justify-center gap-1 rounded-full bg-rose-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                <Bell className="h-3 w-3" />
                {unreadCount}
              </span>
            )}
          </Link>
        );
      })}
    </>
  );

  return (
    <>
      <div className="flex flex-shrink-0 items-center justify-between border-b border-slate-200 bg-white p-4 sm:hidden">
        <div>
          <p className="text-xs text-slate-500">Hoş geldin,</p>
          <p className="font-semibold text-slate-900">{studentName}</p>
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
          <p className="text-xs text-slate-500">Hoş geldin,</p>
          <p className="font-semibold text-slate-900">{studentName}</p>
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