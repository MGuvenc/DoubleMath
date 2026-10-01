import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, BookOpen, MessageCircle, Target, TrendingUp } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import type { TopicProgressRow } from "@/lib/supabase/query-types";

function getLevelLabel(value: number) {
  if (value < 26) return "Başlangıç";
  if (value < 51) return "Gelişiyor";
  if (value < 76) return "İyi";
  return "Çok iyi";
}

export default async function StudentProgressPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: progress } = await supabase
    .from("topics_progress")
    .select("id, student_id, lesson_id, topic, mastery_level, comment, created_at")
    .eq("student_id", user.id)
    .order("created_at", { ascending: false })
    .returns<TopicProgressRow[]>();

  const topicMap = new Map<string, TopicProgressRow[]>();
  for (const entry of progress || []) {
    const key = entry.topic.trim().toLocaleLowerCase("tr-TR");
    const entries = topicMap.get(key) || [];
    entries.push(entry);
    topicMap.set(key, entries);
  }

  const topics = Array.from(topicMap.values()).map((entries) => ({
    latest: entries[0],
    previous: entries[1] || null,
    updateCount: entries.length,
  }));
  const averageMastery = topics.length
    ? Math.round(topics.reduce((total, topic) => total + topic.latest.mastery_level, 0) / topics.length)
    : 0;
  const strongestTopic = [...topics].sort((left, right) => right.latest.mastery_level - left.latest.mastery_level)[0];
  const recentEntries = (progress || []).slice(0, 8);

  return (
    <div className="mx-auto max-w-5xl">
      <header>
        <p className="text-sm font-medium text-brand-700">Öğrenme takibi</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">İlerlemem</h1>
        <p className="mt-1 text-sm text-slate-600">Konularındaki güncel seviyeni ve öğretmen notlarını takip et.</p>
      </header>

      {!topics.length ? (
        <section className="card mt-6 border-l-4 border-brand-500">
          <div className="flex items-start gap-3">
            <BookOpen className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" />
            <div>
              <h2 className="font-semibold text-slate-900">İlerleme kaydın henüz yok</h2>
              <p className="mt-1 text-sm text-slate-600">
                Öğretmenin konu değerlendirmelerini ekledikçe seviyen ve gelişimin burada görünecek.
              </p>
              <Link href="/student/questions" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-brand-700 hover:underline">
                <MessageCircle className="h-4 w-4" /> Öğretmene soru sor
              </Link>
            </div>
          </div>
        </section>
      ) : (
        <>
          <section aria-label="İlerleme özeti" className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="card">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <BookOpen className="h-4 w-4 text-brand-600" /> Takip edilen konu
              </div>
              <p className="mt-2 text-2xl font-bold text-slate-900">{topics.length}</p>
            </div>
            <div className="card">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <TrendingUp className="h-4 w-4 text-emerald-600" /> Ortalama seviye
              </div>
              <p className="mt-2 text-2xl font-bold text-slate-900">%{averageMastery}</p>
            </div>
            <div className="card">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Target className="h-4 w-4 text-amber-600" /> En güçlü konu
              </div>
              <p className="mt-2 truncate text-lg font-bold text-slate-900" title={strongestTopic.latest.topic}>
                {strongestTopic.latest.topic}
              </p>
              <p className="text-xs text-slate-500">%{strongestTopic.latest.mastery_level} · {getLevelLabel(strongestTopic.latest.mastery_level)}</p>
            </div>
          </section>

          <section className="mt-8">
            <h2 className="font-semibold text-slate-900">Konu seviyelerin</h2>
            <div className="mt-3 divide-y divide-slate-200 border-y border-slate-200">
              {topics.map(({ latest, previous, updateCount }) => {
                const change = previous ? latest.mastery_level - previous.mastery_level : null;
                return (
                  <article key={latest.id} className="py-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-slate-900">{latest.topic}</h3>
                        <p className="mt-1 text-sm text-slate-500">{getLevelLabel(latest.mastery_level)} · {updateCount} değerlendirme</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {change !== null && change !== 0 && (
                          <span className={`inline-flex items-center text-sm font-medium ${change > 0 ? "text-emerald-700" : "text-rose-700"}`}>
                            {change > 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                            {change > 0 ? "+" : ""}{change} puan
                          </span>
                        )}
                        <span className="text-lg font-bold tabular-nums text-slate-900">%{latest.mastery_level}</span>
                      </div>
                    </div>
                    <div
                      className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100"
                      role="progressbar"
                      aria-label={`${latest.topic} seviyesi`}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={latest.mastery_level}
                    >
                      <div className="h-full rounded-full bg-brand-600 transition-[width]" style={{ width: `${latest.mastery_level}%` }} />
                    </div>
                    {latest.comment && <p className="mt-3 text-sm leading-6 text-slate-600">{latest.comment}</p>}
                    <p className="mt-2 text-xs text-slate-400">
                      Son değerlendirme: {new Date(latest.created_at).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}
                    </p>
                  </article>
                );
              })}
            </div>
          </section>

          {recentEntries.length > 0 && (
            <section className="mt-8">
              <h2 className="font-semibold text-slate-900">Son değerlendirmeler</h2>
              <ol className="mt-3 divide-y divide-slate-100 border-y border-slate-200">
                {recentEntries.map((entry) => (
                  <li key={entry.id} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-3 text-sm">
                    <span className="font-medium text-slate-800">{entry.topic}</span>
                    <span className="text-slate-500">
                      %{entry.mastery_level} · {new Date(entry.created_at).toLocaleDateString("tr-TR", { day: "numeric", month: "short" })}
                    </span>
                  </li>
                ))}
              </ol>
            </section>
          )}
        </>
      )}
    </div>
  );
}