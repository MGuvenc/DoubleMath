import { createClient } from "@/lib/supabase/server";
import type { StudentOption } from "@/lib/supabase/query-types";

export default async function AdminStudentsPage() {
  const supabase = createClient();

  const { data: students } = await supabase
    .from("profiles")
    .select("id, full_name, email, grade_level")
    .eq("role", "student")
    .order("full_name")
    .returns<StudentOption[]>();

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Öğrenciler</h1>
      <p className="mt-1 text-sm text-slate-500">
        Kayıtlı tüm öğrenciler. Yeni öğrenci{" "}
        <code className="rounded bg-slate-100 px-1">/register</code> sayfasından kendi kaydını oluşturur.
      </p>

      <div className="card mt-6 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-slate-500">
              <th className="pb-2 pr-4">Ad Soyad</th>
              <th className="pb-2 pr-4">E-posta</th>
              <th className="pb-2">Seviye</th>
            </tr>
          </thead>
          <tbody>
            {!students?.length && (
              <tr>
                <td colSpan={3} className="py-6 text-center text-slate-400">
                  Henüz kayıtlı öğrenci yok.
                </td>
              </tr>
            )}
            {students?.map((s) => (
              <tr key={s.id} className="border-b border-slate-100 last:border-0">
                <td className="py-3 pr-4 font-medium text-slate-900">{s.full_name}</td>
                <td className="py-3 pr-4 text-slate-600">{s.email}</td>
                <td className="py-3 text-slate-600">{s.grade_level || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}