"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Paperclip, FileUp, FileCheck } from "lucide-react";
import { submitAssignment } from "@/app/student/assignments/actions";
import type { StudentSubmissionRow } from "@/lib/supabase/query-types";

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  pending: { label: "Bekliyor", className: "bg-slate-100 text-slate-600" },
  submitted: { label: "Teslim Edildi", className: "bg-blue-50 text-blue-700" },
  late: { label: "Geç Teslim Edildi", className: "bg-amber-50 text-amber-700" },
  graded: { label: "Notlandırıldı", className: "bg-green-50 text-green-700" },
};

export default function SubmissionCard({ submission }: { submission: StudentSubmissionRow }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const assignment = submission.assignments;
  const statusInfo = STATUS_LABELS[submission.status];
  const canSubmit = submission.status === "pending" || submission.status === "late";

  if (!assignment) return null;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await submitAssignment(assignment!.id, formData);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-semibold text-slate-900">{assignment.title}</p>
          <p className="text-sm text-slate-500">
            Son tarih: {format(new Date(assignment.due_at), "d MMM yyyy, HH:mm", { locale: tr })}
          </p>
        </div>
        <span className={`rounded-full px-2 py-1 text-xs font-medium ${statusInfo.className}`}>
          {statusInfo.label}
        </span>
      </div>

      {assignment.description && <p className="mt-2 text-sm text-slate-600">{assignment.description}</p>}
      {assignment.attachment_url && (
        
          href={assignment.attachment_url}
          target="_blank"
          className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-brand-600"
        >
          <Paperclip className="h-4 w-4" /> Ödev Dosyasını İndir
        </a>
      )}

      {canSubmit ? (
        <form onSubmit={handleSubmit} className="mt-4 border-t border-slate-100 pt-4">
          <label className="label">Dosyanı Yükle *</label>
          <input type="file" name="file" required className="input" />
          <label className="label mt-3">Not (opsiyonel)</label>
          <textarea name="note" rows={2} className="input" placeholder="Öğretmenine iletmek istediğin bir not..." />
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={isPending} className="btn-primary mt-3 inline-flex items-center gap-2">
            <FileUp className="h-4 w-4" /> {isPending ? "Yükleniyor..." : "Teslim Et"}
          </button>
        </form>
      ) : (
        <div className="mt-4 border-t border-slate-100 pt-4 text-sm">
          <p className="flex items-center gap-1.5 text-slate-600">
            <FileCheck className="h-4 w-4 text-green-600" /> Teslim edildi
            {submission.submitted_at &&
              ` — ${format(new Date(submission.submitted_at), "d MMM yyyy, HH:mm", { locale: tr })}`}
          </p>
          {submission.file_url && (
            <a href={submission.file_url} target="_blank" className="mt-1 inline-block text-brand-600">
              Yüklediğin dosyayı gör
            </a>
          )}
          {submission.status === "graded" && (
            <div className="mt-3 rounded-lg bg-slate-50 p-3">
              <p className="font-semibold text-slate-900">Not: {submission.grade ?? "—"}/100</p>
              {submission.feedback && <p className="mt-1 text-slate-600">{submission.feedback}</p>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}