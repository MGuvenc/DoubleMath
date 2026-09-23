import { createClient, createAdminClient } from "@/lib/supabase/server";
import AssignmentsManager from "@/components/admin/AssignmentsManager";
import type { AssignmentWithSubmissionsRow, StudentOption } from "@/lib/supabase/query-types";

export default async function AdminAssignmentsPage() {
  const supabase = createClient();
  const adminSupabase = createAdminClient();

  const { data: students } = await supabase
    .from("profiles")
    .select("id, full_name, email, grade_level")
    .eq("role", "student")
    .eq("is_active", true)
    .order("full_name")
    .returns<StudentOption[]>();

  const { data: assignments } = await supabase
    .from("assignments")
    .select(
      "*, submissions(id, student_id, file_url, note, status, grade, feedback, submitted_at, profiles(full_name, email))"
    )
    .order("due_at", { ascending: false })
    .returns<AssignmentWithSubmissionsRow[]>();

  // Private bucket'lardaki dosyalar için geçici (1 saatlik) görüntüleme linkleri üret
  const assignmentsWithUrls = await Promise.all(
    (assignments || []).map(async (a) => {
      const attachmentSignedUrl = a.attachment_url
        ? (await adminSupabase.storage.from("assignments").createSignedUrl(a.attachment_url, 3600)).data
            ?.signedUrl || null
        : null;

      const submissionsWithUrls = await Promise.all(
        a.submissions.map(async (s) => ({
          ...s,
          file_url: s.file_url
            ? (await adminSupabase.storage.from("submissions").createSignedUrl(s.file_url, 3600)).data
                ?.signedUrl || null
            : null,
        }))
      );

      return { ...a, attachment_url: attachmentSignedUrl, submissions: submissionsWithUrls };
    })
  );

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Ödevler</h1>
      <p className="mt-1 text-sm text-slate-500">Ödev oluştur, teslimleri görüntüle ve notlandır.</p>

      <div className="mt-6">
        <AssignmentsManager students={students || []} assignments={assignmentsWithUrls} />
      </div>
    </div>
  );
}