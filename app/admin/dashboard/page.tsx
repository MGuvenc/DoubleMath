import { createClient } from "@/lib/supabase/server";
import { Users, Calendar, MessageCircle, ClipboardList } from "lucide-react";

export default async function AdminDashboard() {
  const supabase = createClient();

  const [{ count: studentCount }, { count: lessonCount }, { count: openQuestions }, { count: pendingSubmissions }] =
    await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "student"),
      supabase
        .from("lessons")
        .select("*", { count: "exact", head: true })
        .eq("status", "scheduled")
        .gte("starts_at", new Date().toISOString()),
      supabase.from("questions").select("*", { count: "exact", head: true }).eq("status", "open"),
      supabase.from("submissions").select("*", { count: "exact", head: true }).eq("status", "pending"),
    ]);

  const stats = [
    { label: "Aktif Öğrenci", value: studentCount ?? 0, icon: Users },
    { label: "Yaklaşan Ders", value: lessonCount ?? 0, icon: Calendar },
    { label: "Açık Soru", value: openQuestions ?? 0, icon: MessageCircle },
    { label: "Bekleyen Ödev", value: pendingSubmissions ?? 0, icon: ClipboardList },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Admin Paneli</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="card">
            <s.icon className="h-6 w-6 text-brand-600" />
            <p className="mt-3 text-2xl font-bold text-slate-900">{s.value}</p>
            <p className="text-sm text-slate-500">{s.label}</p>
          </div>
        ))}
      </div>
      <p className="mt-8 text-sm text-slate-500">
        Öğrenci ekleme, ders programı oluşturma ve diğer yönetim işlemleri için sol menüyü kullan.
      </p>
    </div>
  );
}
