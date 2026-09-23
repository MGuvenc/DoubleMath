import { createClient, createAdminClient } from "@/lib/supabase/server";
import SubmissionCard from "@/components/student/SubmissionCard";
import type { StudentSubmissionRow } from "@/lib/supabase/query-types";

export default async function StudentAssignmentsPage() {
  const supabase = createClient();
  const adminSupabase = createAdminClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: submissions } = await supabase
    .from("submissions")
    .select("*, assignments(id, title, description, attachment_url, due_at, created_at)")
    .eq("student_id", user!.id)
    .order("created_at", { ascending: false })
    .returns<StudentSubmissionRow[]>();

  const withUrls = await Promise.all(
    (submissions || []).map(async (s) => {
      const attachmentSignedUrl = s.assignments?.attachment_url
        ? (await adminSupabase.storage.from("assignments").createSignedUrl(s.assignments.attachment_url, 3600))
            .data?.signedUrl || null
        : null;
      const fileSignedUrl = s.file_url
        ? (await adminSupabase.storage.from("submissions").createSignedUrl(s.file_url, 3600)).data?.signedUrl ||
          null
        : null;
      return {
        ...s,
        file_url: fileSignedUrl,
        assignments: s.assignments ? { ...s.assignments, attachment_url: attachmentSignedUrl } : null,
      };
    })
  );

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Ödevlerim</h1>
      <div className="mt-6 space-y-4">
        {withUrls.length === 0 && (
          <div className="card text-center text-sm text-slate-400">Henüz sana verilmiş bir ödev yok.</div>
        )}
        {withUrls.map((s) => (
          <SubmissionCard key={s.id} submission={s} />
        ))}
      </div>
    </div>
  );
}