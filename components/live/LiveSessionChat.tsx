"use client";

import { useEffect, useState } from "react";
import { MessageSquare, Send } from "lucide-react";

type LiveComment = {
  id: string;
  body: string;
  created_at: string;
  sender_id: string;
  profiles?: { full_name?: string | null } | null;
};

export function LiveSessionChat({ sessionId }: { sessionId: string }) {
  const [comments, setComments] = useState<LiveComment[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const intervalId = setInterval(() => {
      void loadComments();
    }, 3000);

    async function loadComments() {
      try {
        const response = await fetch(`/api/live/comments?sessionId=${encodeURIComponent(sessionId)}`);
        const payload = await response.json();
        if (!response.ok) throw new Error(payload?.error || "Yorumlar yüklenemedi.");
        if (active) setComments(payload.comments || []);
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : "Yorumlar yüklenemedi.");
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadComments();

    return () => {
      active = false;
      clearInterval(intervalId);
    };
  }, [sessionId]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = message.trim();
    if (!trimmed) return;

    setSending(true);
    setError(null);

    try {
      const response = await fetch("/api/live/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, body: trimmed }),
      });

      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error || "Mesaj gönderilemedi.");

      setComments((current) => [...current, payload.comment]);
      setMessage("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Mesaj gönderilemedi.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-800">
        <MessageSquare className="h-4 w-4 text-brand-600" />
        Canlı sohbet
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="text-sm text-slate-400">Yorumlar yükleniyor...</div>
        ) : comments.length === 0 ? (
          <div className="text-sm text-slate-400">Henüz yorum yok. İlk yorumu sen yaz.</div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="mb-1 flex items-center justify-between gap-2 text-xs text-slate-500">
                <span className="font-medium text-slate-700">{comment.profiles?.full_name || "Öğrenci"}</span>
                <span>{new Date(comment.created_at).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}</span>
              </div>
              <p className="text-sm leading-6 text-slate-700">{comment.body}</p>
            </div>
          ))
        )}
      </div>

      {error && <p className="mt-3 text-xs text-rose-600">{error}</p>}

      <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
        <input
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Mesaj yaz..."
          className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-brand-300 focus:ring-2 focus:ring-brand-100"
          maxLength={1000}
        />
        <button
          type="submit"
          disabled={sending || !message.trim()}
          className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-3 py-2.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Send className="h-4 w-4" />
          {sending ? "Gönderiliyor..." : "Gönder"}
        </button>
      </form>
    </div>
  );
}
