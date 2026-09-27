import { getInstagramSettings } from "./actions";
import InstagramSettingsForm from "@/components/admin/InstagramSettingsForm";

export default async function AdminSettingsPage() {
  const settings = await getInstagramSettings();

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Ayarlar</h1>

      <div className="mt-6">
        <h2 className="font-semibold text-slate-900">Instagram Entegrasyonu</h2>
        <p className="mt-1 text-sm text-slate-500">
          Instagram Business/Creator hesabını Facebook Developer üzerinden bağladıktan sonra
          aldığın Access Token ve Business Account ID&apos;yi buraya gir.
        </p>
        <div className="mt-4">
          <InstagramSettingsForm
            initialAccessToken={settings.accessToken}
            initialBusinessAccountId={settings.businessAccountId}
            lastSyncCount={settings.lastSyncCount}
          />
        </div>
      </div>
    </div>
  );
}