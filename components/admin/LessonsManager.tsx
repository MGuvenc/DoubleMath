"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Plus, Pencil, XCircle, ExternalLink } from "lucide-react";
import { createLesson, updateLesson, cancelLesson, dismissRescheduleRequest } from "@/app/admin/lessons/actions";
import type { LessonWithStudentRow, StudentOption } from "@/lib/supabase/query-types";

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  scheduled: { label: "Planlandı", className: "bg-blue-50 text-blue-700" },
  completed: { label: "Tamamlandı", className: "bg-green-50 text-green-700" },
  cancelled: { label: "İptal Edildi", className: "bg-red-50 text-red-700" },
  reschedule_requested: { label: "Erteleme Talebi", className: "bg-amber-50 text-amber-700" },
};

export default function LessonsManager({
  students,
  initialLessons,
}: {
  students: StudentOption[];
  initialLessons: LessonWithStudentRow[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);
  const [editingLesson, setEditingLesson] = useState<LessonWithStudentRow | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"upcoming" | "past" | "all">("upcoming");

  const now = new Date();
  const filteredLessons = initialLessons.filter((l) => {
    if (filter === "upcoming") return new Date(l.starts_at) >= now && l.status !== "cancelled";
    if (filter === "past") return new Date(l.starts_at) < now || l.status === "completed";
    return true;
  });

  function openCreateForm() {
    setEditingLesson(null);
    setFormError(null);
    setShowForm(true);
  }

  function openEditForm(lesson: LessonWithStudentRow) {
    setEditingLesson(lesson);
    setFormError(null);
    setShowForm(true);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = editingLesson
        ? await updateLesson(editingLesson.id, formData)
        : await createLesson(formData);

      if ("error" in result) {
        setFormError(result.error);
        return;
      }

      setShowForm(false);
      setEditingLesson(null);
      router.refresh();
    });
  }

  function handleCancel(lessonId: string) {
    if (!confirm("Bu dersi iptal etmek istediğine emin misin?")) return;
    startTransition(async () => {
      await cancelLesson(lessonId);
      router.refresh();
    });
  }

  function handleDismissRequest(lessonId: string) {
    startTransition(async () => {
      await dismissRescheduleRequest(lessonId);
      router.refresh();
    });
  }

  // Düzenleme formunu mevcut ders değerleriyle önceden doldurmak için
  const editDefaults = editingLesson
    ? {
        date: format(new Date(editingLesson.starts_at), "yyyy-MM-dd"),
        startTime: format(new Date(editingLesson.starts_at), "HH:mm"),
        endTime: format(new Date(editingLesson.ends_at), "HH:mm"),
      }
    : null;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          {(["upcoming", "past", "all"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                filter === f ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {f === "upcoming" ? "Yaklaşan" : f === "past" ? "Geçmiş" : "Tümü"}
            </button>
          ))}
        </div>
        <button onClick={openCreateForm} className="btn-primary inline-flex items-center gap-2">
          <Plus className="h-4 w-4" /> Yeni Ders Ekle
        </button>
      </div>

      {showForm && (
        <div className="card mt-4">
          <h2 className="font-semibold text-slate-900">
            {editingLesson ? "Dersi Düzenle" : "Yeni Ders Ekle"}
          </h2>
          <form onSubmit={handleSubmit} className="mt-4 grid gap-4 sm:grid-cols-2">
            {!editingLesson && (
              <div className="sm:col-span-2">
                <label className="label">Öğrenci *</label>
                <select name="student_id" required className="input">
                  <option value="">Seç...</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.full_name} ({s.email})
                      {s.grade_level ? ` — ${s.grade_level}` : ""}
                    </option>
                  ))}
                </select>
                {students.length === 0 && (
                  <p className="mt-1 text-xs text-amber-600">
                    Henüz kayıtlı öğrenci yok. Öğrenci /register sayfasından kayıt olmalı.
                  </p>
                )}
              </div>
            )}
            {editingLesson && (
              <div className="sm:col-span-2 text-sm text-slate-600">
                Öğrenci: <strong>{editingLesson.profiles?.full_name}</strong>{" "}
                <span className="text-slate-400">
                  (öğrenci değiştirilemez, gerekiyorsa dersi iptal edip yeniden oluştur)
                </span>
              </div>
            )}
            <div>
              <label className="label">Tarih *</label>
              <input type="date" name="date" required defaultValue={editDefaults?.date} className="input" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="label">Başlangıç *</label>
                <input
                  type="time"
                  name="start_time"
                  required
                  defaultValue={editDefaults?.startTime}
                  className="input"
                />
              </div>
              <div>
                <label className="label">Bitiş *</label>
                <input
                  type="time"
                  name="end_time"
                  required
                  defaultValue={editDefaults?.endTime}
                  className="input"
                />
              </div>
            </div>
            <div>
              <label className="label">Konu</label>
              <input
                type="text"
                name="topic"
                defaultValue={editingLesson?.topic || ""}
                placeholder="Örn: Türev, Fonksiyonlar..."
                className="input"
              />
            </div>
            <div>
              <label className="label">Görüşme Linki (Zoom/Meet)</label>
              <input
                type="url"
                name="meeting_url"
                defaultValue={editingLesson?.meeting_url || ""}
                placeholder="https://..."
                className="input"
              />
            </div>

            {formError && <p className="text-sm text-red-600 sm:col-span-2">{formError}</p>}

            <div className="flex gap-3 sm:col-span-2">
              <button type="submit" disabled={isPending} className="btn-primary">
                {isPending ? "Kaydediliyor..." : editingLesson ? "Güncelle" : "Oluştur"}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">
                Vazgeç
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-slate-500">
              <th className="pb-2 pr-4">Öğrenci</th>
              <th className="pb-2 pr-4">Tarih / Saat</th>
              <th className="pb-2 pr-4">Konu</th>
              <th className="pb-2 pr-4">Durum</th>
              <th className="pb-2">İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {filteredLessons.length === 0 && (
              <tr>
                <td colSpan={5} className="py-6 text-center text-slate-400">
                  Bu filtreye uyan ders bulunamadı.
                </td>
              </tr>
            )}
            {filteredLessons.map((lesson) => {
              const statusInfo = STATUS_LABELS[lesson.status];
              return (
                <tr key={lesson.id} className="border-b border-slate-100 last:border-0">
                  <td className="py-3 pr-4">
                    <p className="font-medium text-slate-900">{lesson.profiles?.full_name}</p>
                    <p className="text-xs text-slate-400">{lesson.profiles?.email}</p>
                  </td>
                  <td className="py-3 pr-4 text-slate-600">
                    {format(new Date(lesson.starts_at), "d MMM yyyy, HH:mm", { locale: tr })} –{" "}
                    {format(new Date(lesson.ends_at), "HH:mm")}
                  </td>
                  <td className="py-3 pr-4 text-slate-600">{lesson.topic || "—"}</td>
                                    <td className="py-3 pr-4 text-slate-600">
                    {lesson.topic || "—"}
                    {lesson.status === "reschedule_requested" && lesson.reschedule_reason && (
                      <p className="mt-1 text-xs italic text-amber-600">
                        Sebep: {lesson.reschedule_reason}
                      </p>
                    )}
                  </td>
                  <td className="py-3 pr-4">
                    <span className={`rounded-full px-2 py-1 text-xs font-medium ${statusInfo.className}`}>
                      {statusInfo.label}
                    </span>
                  </td>
                  <td className="py-3">
                    <div className="flex items-center gap-3">
                      {lesson.meeting_url && (
                        <a href={lesson.meeting_url} target="_blank" title="Görüşme linki">
                          <ExternalLink className="h-4 w-4 text-slate-400 hover:text-brand-600" />
                        </a>
                      )}
                      {lesson.status === "reschedule_requested" && (
                        <button
                          onClick={() => handleDismissRequest(lesson.id)}
                          className="text-xs font-medium text-slate-500 hover:text-brand-600"
                          title="Talebi reddet, dersi orijinal saatinde tut"
                        >
                          Talebi Reddet
                        </button>
                      )}
                      {(lesson.status === "scheduled" || lesson.status === "reschedule_requested") && (
                        <>
                          <button onClick={() => openEditForm(lesson)} title="Düzenle / Yeni Saate Al">
                            <Pencil className="h-4 w-4 text-slate-400 hover:text-brand-600" />
                          </button>
                          <button onClick={() => handleCancel(lesson.id)} title="İptal Et">
                            <XCircle className="h-4 w-4 text-slate-400 hover:text-red-600" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}