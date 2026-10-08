import { createClient } from "@/lib/supabase/server";
import { getInstagramSettings } from "./actions";
import InstagramSettingsForm from "@/components/admin/InstagramSettingsForm";
import { getBankTransferSettings } from "./bank-actions";
import BankTransferSettingsForm from "@/components/admin/BankTransferSettingsForm";
import AccountCredentialsForm from "@/components/account/AccountCredentialsForm";

export default async function AdminSettingsPage() {
  const [settings, bankSettings, authResult] = await Promise.all([
    getInstagramSettings(),
    getBankTransferSettings(),
    createClient().auth.getUser(),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Ayarlar</h1>

      <div className="mt-6">
        <h2 className="font-semibold text-slate-900">Hesap Bilgileri</h2>
        <p className="mt-1 text-sm text-slate-500">
          Yönetici e-posta adresini veya şifreni güncelle.
        </p>
        <AccountCredentialsForm currentEmail={authResult.data.user?.email || ""} />
      </div>

      <div className="mt-6">
        <h2 className="font-semibold text-slate-900">Banka Havale/EFT</h2>
        <p className="mt-1 text-sm text-slate-500">
          Checkout ekranında öğrenci ve velilere gösterilecek hesap bilgileri.
        </p>
        <div className="mt-4">
          <BankTransferSettingsForm initialSettings={bankSettings} />
        </div>
      </div>

      <div className="mt-10">
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