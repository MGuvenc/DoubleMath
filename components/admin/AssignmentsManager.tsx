"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Plus, Paperclip, ChevronDown, ChevronUp, FileDown } from "lucide-react";
import { createAssignment, gradeSubmission } from "@/app/admin/assignments/actions";
import type { AssignmentWithSubmissionsRow, StudentOption } from "@/lib/supabase/query-types";

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  pending: { label: "Bekliyor", className: "bg-slate-100 text-slate-600" },
  submitted: { label: "Teslim Edildi", className: "bg-blue-50 text-blue-700" },
  late: { label: "Geç Teslim", className: "bg-amber-50 text-amber-700" },
  graded: { label: "Notlandırıldı", className: "bg-green-50 text-green-700" },
};

export default function AssignmentsManager({
  students,
  assignments,
}: {
  students: StudentOption[];
  assignments: AssignmentWithSubmissionsRow[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);
  const [targetMode, setTargetMode] = useState<"all" | "specific">("all");
  const [formError, setFormError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await createAssignment(formData);
      if ("error" in result) {
        setFormError(result.error);
        return;
      }
      setShowForm(false);
      router.refresh();
    });
  }

  return (
    <div>
      <div className="flex justify-end">
        <button onClick={() => setShowForm((v) => !v)} className="btn-primary inline-flex items-center gap-2">
          <Plus className="h-4 w-4" /> Yeni Ödev Ver
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="card mt-4 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="label">Başlık *</label>
            <input name="title" required className="input" placeholder="Örn: Türev Alıştırmaları 1" />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Açıklama</label>
            <textarea name="description" rows={2} className="input" />
          </div>
          <div>
            <label className="label">Son Tarih *</label>
            <input type="date" name="due_date" required className="input" />
          </div>
          <div>
            <label className="label">Son Saat</label>
            <input type="time" name="due_time" defaultValue="23:59" className="input" />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Ek Dosya</label>
            <input
              type="file"
              name="attachment"
              accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.jpg,.jpeg,.png,.webp,.zip"
              className="input"
            />
            <p className="mt-1 text-xs text-slate-400">PDF, Word, PowerPoint, Excel, resim veya zip — maksimum 50MB</p>
          </div>

          <div className="sm:col-span-2">
            <label className="label">Kime Verilecek?</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="target_mode"
                  value="all"
                  checked={targetMode === "all"}
                  onChange={() => setTargetMode("all")}
                />
                Tüm Öğrenciler
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="target_mode"
                  value="specific"
                  checked={targetMode === "specific"}
                  onChange={() => setTargetMode("specific")}
                />
                Belirli Öğrenciler
              </label>
            </div>
          </div>

          {targetMode === "specific" && (
            <div className="sm:col-span-2 max-h-40 overflow-y-auto rounded-lg border border-slate-200 p-3">
              {students.map((s) => (
                <label key={s.id} className="flex items-center gap-2 py-1 text-sm">
                  <input type="checkbox" name="student_ids" value={s.id} />
                  {s.full_name} ({s.email})
                </label>
              ))}
              {students.length === 0 && (
                <p className="text-sm text-slate-400">Kayıtlı öğrenci yok.</p>
              )}
            </div>
          )}

          {formError && <p className="text-sm text-red-600 sm:col-span-2">{formError}</p>}

          <div className="flex gap-3 sm:col-span-2">
            <button type="submit" disabled={isPending} className="btn-primary">
              {isPending ? "Oluşturuluyor..." : "Ödevi Oluştur"}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">
              Vazgeç
            </button>
          </div>
        </form>
      )}

      <div className="mt-6 space-y-3">
        {assignments.length === 0 && (
          <div className="card text-center text-sm text-slate-400">Henüz ödev oluşturulmadı.</div>
        )}
        {assignments.map((a) => {
          const isOpen = expanded.has(a.id);
          const submittedCount = a.submissions.filter((s) => s.status !== "pending").length;
          return (
            <div key={a.id} className="card">
              <button
                onClick={() => toggleExpand(a.id)}
                className="flex w-full items-center justify-between text-left"
              >
                <div>
                  <p className="font-semibold text-slate-900">{a.title}</p>
                  <p className="text-sm text-slate-500">
                    Son tarih: {format(new Date(a.due_at), "d MMM yyyy, HH:mm", { locale: tr })} —{" "}
                    {submittedCount}/{a.submissions.length} teslim
                  </p>
                </div>
                {isOpen ? (
                  <ChevronUp className="h-5 w-5 text-slate-400" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-slate-400" />
                )}
              </button>

              {isOpen && (
                <div className="mt-4 border-t border-slate-100 pt-4">
                  {a.description && <p className="mb-3 text-sm text-slate-600">{a.description}</p>}
                  {a.attachment_url && (
                    <a
                      href={a.attachment_url}
                      target="_blank"
                      className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-brand-600"
                    >
                      <Paperclip className="h-4 w-4" /> Ödev Dosyasını Gör
                    </a>
                  )}

                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 text-left text-slate-500">
                          <th className="pb-2 pr-4">Öğrenci</th>
                          <th className="pb-2 pr-4">Durum</th>
                          <th className="pb-2 pr-4">Dosya</th>
                          <th className="pb-2 pr-4">Not (0-100)</th>
                          <th className="pb-2">Geri Bildirim</th>
                        </tr>
                      </thead>
                      <tbody>
                        {a.submissions.map((s) => (
                          <SubmissionRow key={s.id} submission={s} />
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SubmissionRow({ submission }: { submission: AssignmentWithSubmissionsRow["submissions"][number] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [grade, setGrade] = useState(submission.grade?.toString() || "");
  const [feedback, setFeedback] = useState(submission.feedback || "");
  const statusInfo = STATUS_LABELS[submission.status];

  function handleGrade() {
    startTransition(async () => {
      await gradeSubmission(submission.id, grade ? Number(grade) : null, feedback);
      router.refresh();
    });
  }

  return (
    <tr className="border-b border-slate-100 last:border-0">
      <td className="py-2 pr-4">
        <p className="font-medium text-slate-900">{submission.profiles?.full_name}</p>
      </td>
      <td className="py-2 pr-4">
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusInfo.className}`}>
          {statusInfo.label}
        </span>
      </td>
      <td className="py-2 pr-4">
        {submission.file_url ? (
          <a href={submission.file_url} target="_blank" className="inline-flex items-center gap-1 text-brand-600">
            <FileDown className="h-4 w-4" /> Görüntüle
          </a>
        ) : (
          <span className="text-slate-400">—</span>
        )}
      </td>
    <td className="py-2 pr-4">
        {submission.status === "pending" ? (
          <span className="text-slate-300">—</span>
        ) : (
          <input
            type="number"
            min={0}
            max={100}
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
            className="input w-20"
          />
        )}
      </td>
      <td className="py-2">
        {submission.status === "pending" ? (
          <span className="text-xs italic text-slate-400">Öğrenci henüz teslim etmedi</span>
        ) : (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Kısa yorum..."
              className="input"
            />
            <button
              onClick={handleGrade}
              disabled={isPending}
              className="whitespace-nowrap text-sm font-medium text-brand-600 hover:underline"
            >
              Kaydet
            </button>
          </div>
        )}
      </td>
    </tr>
  );
}