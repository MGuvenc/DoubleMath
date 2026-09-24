"use client";

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
  LogOut,
} from "lucide-react";

const LINKS = [
  { href: "/student/dashboard", label: "Panel", icon: LayoutDashboard },
  { href: "/student/lessons", label: "Derslerim", icon: Calendar },
  { href: "/student/progress", label: "İlerlemem", icon: TrendingUp },
  { href: "/student/assignments", label: "Ödevlerim", icon: ClipboardList },
  { href: "/student/materials", label: "Kaynaklar", icon: BookOpen },
  { href: "/student/quizzes", label: "Sınavlar", icon: ClipboardCheck },
  { href: "/student/questions", label: "Öğretmene Sor", icon: MessageCircle },
  { href: "/student/announcements", label: "Duyurular", icon: Bell },
];

export default function StudentSidebar({ studentName }: { studentName: string }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <>
      {/* Masaüstü yan menü */}
      <aside className="hidden w-64 flex-col border-r border-slate-200 bg-white p-4 sm:flex">
        <div className="mb-6 px-2">
          <p className="text-xs text-slate-500">Hoş geldin,</p>
          <p className="font-semibold text-slate-900">{studentName}</p>
        </div>
        <nav className="flex-1 space-y-1">
          {LINKS.map((l) => {
            const active = pathname === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                  active
                    ? "bg-brand-50 text-brand-700"
                    : "text-slate-600 hover:bg-slate-50"
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

      {/* Mobil alt menü */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 flex justify-around border-t border-slate-200 bg-white py-2 sm:hidden">
        {LINKS.slice(0, 5).map((l) => {
          const active = pathname === l.href;
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`flex flex-col items-center gap-1 px-2 text-[11px] ${
                active ? "text-brand-700" : "text-slate-500"
              }`}
            >
              <l.icon className="h-5 w-5" />
              {l.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
