"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import { addTopicProgress } from "@/app/admin/progress/actions";
import type { StudentOption, TopicProgressWithStudentRow } from "@/lib/supabase/query-types";
import MathSubmitButton from "@/components/ui/MathSubmitButton";

function getLevelLabel(value: number) {
  if (value < 26) return "Başlangıç";
  if (value < 51) return "Gelişiyor";
  if (value < 76) return "İyi";
  return "Çok iyi";
}

export default function TopicProgressManager({
  students,
  progress,
}: {
  students: StudentOption[];
  progress: TopicProgressWithStudentRow[];
}) {
  const router = useRouter();
  const [isSaving, startSaving] = useTransition();
  const [studentId, setStudentId] = useState(students[0]?.id || "");
  const [masteryLevel, setMasteryLevel] = useState(50);
  const [topic, setTopic] = useState("");
  const [comment, setComment] = useState("");
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    const formData = new FormData(event.currentTarget);

    startSaving(async () => {
      const result = await addTopicProgress(formData);
      if ("error" in result) {
        setMessage({ text: result.error, isError: true });
        return;
      }
      setTopic("");
      setComment("");
      setMessage({ text: "İlerleme kaydı eklendi ve öğrenciye bildirildi.", isError: false });
      router.refresh();
    });
  }

  return (
    <div className="space-y-8">
      <form onSubmit={handleSubmit} className="card grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="progress-student">Öğrenci</label>
          <select
            id="progress-student"
            name="student_id"
            className="input"
            required
            value={studentId}
            onChange={(event) => setStudentId(event.target.value)}
            disabled={!students.length}
          >
            {!students.length && <option value="">Kayıtlı öğrenci yok</option>}
            {students.map((student) => (
              <option key={student.id} value={student.id}>{student.full_name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="progress-topic">Konu</label>
          <input
            id="progress-topic"
            name="topic"
            className="input"
            maxLength={120}
            required
            placeholder="Örn. İkinci derece denklemler"
            value={topic}
            onChange={(event) => setTopic(event.target.value)}
          />
        </div>
        <div className="sm:col-span-2">
          <div className="flex items-center justify-between gap-3">
            <label className="label mb-0" htmlFor="progress-range">Konu seviyesi</label>
            <span className="text-sm font-semibold text-slate-800">{masteryLevel}% · {getLevelLabel(masteryLevel)}</span>
          </div>
          <input
            id="progress-range"
            type="range"
            min={0}
            max={100}
            step={1}
            value={masteryLevel}
            onChange={(event) => setMasteryLevel(Number(event.target.value))}
            className="mt-3 w-full accent-brand-600"
            aria-label="Konu seviyesi yüzdesi"
          />
          <input type="hidden" name="mastery_level" value={masteryLevel} />
          <div className="mt-2 flex items-center gap-2">
            <label htmlFor="progress-number" className="text-xs text-slate-500">Yüzde</label>
            <input
              id="progress-number"
              type="number"
              min={0}
              max={100}
              step={1}
              value={masteryLevel}
              onChange={(event) => setMasteryLevel(Math.max(0, Math.min(100, Number(event.target.value))))}
              className="input w-24"
            />
          </div>
        </div>
        <div className="sm:col-span-2">
          <label className="label" htmlFor="progress-comment">Öğretmen notu</label>
          <textarea
            id="progress-comment"
            name="comment"
            className="input"
            rows={3}
            maxLength={2000}
            placeholder="Güçlü olduğu noktalar ve çalışması gerekenler"
            value={comment}
            onChange={(event) => setComment(event.target.value)}
          />
        </div>
        {message && (
          <p role={message.isError ? "alert" : "status"} className={`text-sm sm:col-span-2 ${message.isError ? "text-red-600" : "text-green-700"}`}>
            {message.text}
          </p>
        )}
        <div className="sm:col-span-2">
          <MathSubmitButton
            type="submit"
            loading={isSaving}
            disabled={!students.length}
            pendingText="Kaydediliyor..."
            className="btn-primary inline-flex items-center gap-2"
          >
            <Save className="h-4 w-4" /> İlerleme Kaydet
          </MathSubmitButton>
        </div>
      </form>

      <section>
        <h2 className="font-semibold text-slate-900">Son kayıtlar</h2>
        <div className="card mt-3 overflow-x-auto">
          <table className="w-full min-w-[650px] text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="pb-3 pr-4">Öğrenci</th>
                <th className="pb-3 pr-4">Konu</th>
                <th className="pb-3 pr-4">Seviye</th>
                <th className="pb-3 pr-4">Öğretmen notu</th>
                <th className="pb-3">Tarih</th>
              </tr>
            </thead>
            <tbody>
              {!progress.length && (
                <tr><td colSpan={5} className="py-8 text-center text-slate-400">Henüz ilerleme kaydı girilmemiş.</td></tr>
              )}
              {progress.map((entry) => (
                <tr key={entry.id} className="border-b border-slate-100 last:border-0">
                  <td className="py-3 pr-4 font-medium text-slate-900">{entry.profiles?.full_name || "Öğrenci"}</td>
                  <td className="py-3 pr-4 text-slate-700">{entry.topic}</td>
                  <td className="py-3 pr-4 text-slate-700">{entry.mastery_level}% · {getLevelLabel(entry.mastery_level)}</td>
                  <td className="max-w-sm whitespace-pre-wrap py-3 pr-4 text-slate-600">{entry.comment || "—"}</td>
                  <td className="py-3 text-slate-600">{new Date(entry.created_at).toLocaleDateString("tr-TR")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}