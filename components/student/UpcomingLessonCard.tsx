"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Video, CalendarClock } from "lucide-react";
import { requestReschedule } from "@/app/student/lessons/actions";
import type { LessonRow } from "@/lib/supabase/query-types";

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  scheduled: { label: "Planlandı", className: "bg-blue-50 text-blue-700" },
  completed: { label: "Tamamlandı", className: "bg-green-50 text-green-700" },
  cancelled: { label: "İptal Edildi", className: "bg-red-50 text-red-700" },
  reschedule_requested: { label: "Erteleme Talebi Gönderildi", className: "bg-amber-50 text-amber-700" },
};

export default function UpcomingLessonCard({ lesson }: { lesson: LessonRow }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  const statusInfo = STATUS_LABELS[lesson.status];

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await requestReschedule(lesson.id, reason);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setShowForm(false);
      setReason("");
      router.refresh();
    });
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-semibold text-slate-900">
            {format(new Date(lesson.starts_at), "d MMMM EEEE, HH:mm", { locale: tr })}
          </p>
          {lesson.topic && <p className="text-sm text-slate-600">Konu: {lesson.topic}</p>}
          <span className={`mt-2 inline-block rounded-full px-2 py-1 text-xs font-medium ${statusInfo.className}`}>
            {statusInfo.label}
          </span>
          {lesson.status === "reschedule_requested" && lesson.reschedule_reason && (
            <p className="mt-2 text-xs text-slate-500">Sebep: {lesson.reschedule_reason}</p>
          )}
        </div>
        <div className="flex flex-col items-end gap-2">
          {lesson.meeting_url && lesson.status === "scheduled" && (
            <a href={lesson.meeting_url} target="_blank" className="btn-primary inline-flex items-center gap-2">
              <Video className="h-4 w-4" /> Derse Katıl
            </a>
          )}
          {lesson.status === "scheduled" && !showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-brand-600"
            >
              <CalendarClock className="h-4 w-4" /> Erteleme Talep Et
            </button>
          )}
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mt-4 border-t border-slate-100 pt-4">
          <label className="label">Erteleme sebebin nedir?</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
            required
            minLength={5}
            placeholder="Örn: O saatte sınavım var, başka bir saate alabilir miyiz?"
            className="input"
          />
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          <div className="mt-3 flex gap-2">
            <button type="submit" disabled={isPending} className="btn-primary">
              {isPending ? "Gönderiliyor..." : "Talebi Gönder"}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">
              Vazgeç
            </button>
          </div>
        </form>
      )}
    </div>
  );
}