"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, Save } from "lucide-react";
import { saveInstagramSettings, syncInstagramPosts } from "@/app/admin/settings/actions";
import MathSubmitButton from "@/components/ui/MathSubmitButton";

export default function InstagramSettingsForm({
  initialAccessToken,
  initialBusinessAccountId,
  lastSyncCount,
}: {
  initialAccessToken: string;
  initialBusinessAccountId: string;
  lastSyncCount: number;
}) {
  const router = useRouter();
  const [isSaving, startSaving] = useTransition();
  const [isSyncing, startSyncing] = useTransition();
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaveMessage(null);
    const formData = new FormData(e.currentTarget);

    startSaving(async () => {
      const result = await saveInstagramSettings(formData);
      if ("error" in result) {
        setSaveMessage(result.error);
        return;
      }
      setSaveMessage("Kaydedildi.");
      router.refresh();
    });
  }

  function handleSync() {
    setSyncMessage(null);
    startSyncing(async () => {
      const result = await syncInstagramPosts();
      if ("error" in result) {
        setSyncMessage(result.error);
        return;
      }
      setSyncMessage(`${result.count} gönderi senkronize edildi.`);
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSave} className="card space-y-4">
        <div>
          <label className="label">Access Token</label>
          <input
            type="password"
            name="access_token"
            defaultValue={initialAccessToken}
            placeholder="Instagram Graph API access token"
            className="input"
          />
        </div>
        <div>
          <label className="label">Instagram Business Account ID</label>
          <input
            type="text"
            name="business_account_id"
            defaultValue={initialBusinessAccountId}
            placeholder="Örn: 17841400000000000"
            className="input"
          />
        </div>
        {saveMessage && (
          <p className={`text-sm ${saveMessage === "Kaydedildi." ? "text-green-600" : "text-red-600"}`}>
            {saveMessage}
          </p>
        )}
        <MathSubmitButton type="submit" loading={isSaving} pendingText="Ayarlar kaydediliyor..." className="btn-primary inline-flex items-center gap-2">
          <Save className="h-4 w-4" /> Kaydet
        </MathSubmitButton>
      </form>

      <div className="card">
        <p className="text-sm text-slate-600">
          Önbellekte <strong>{lastSyncCount}</strong> gönderi var.
        </p>
        <MathSubmitButton
          type="button"
          onClick={handleSync}
          loading={isSyncing}
          pendingText="Instagram gönderileri eşitleniyor..."
          className="btn-secondary mt-3 inline-flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" /> Şimdi Senkronize Et
        </MathSubmitButton>
        {syncMessage && (
          <p className={`mt-2 text-sm ${syncMessage.includes("hata") ? "text-red-600" : "text-slate-600"}`}>
            {syncMessage}
          </p>
        )}
        <p className="mt-3 text-xs text-slate-400">
          Not: Şu an manuel senkronizasyon var. İleride bunu otomatik (günlük) çalışan bir
          zamanlanmış göreve (cron) bağlayabiliriz.
        </p>
      </div>
    </div>
  );
}