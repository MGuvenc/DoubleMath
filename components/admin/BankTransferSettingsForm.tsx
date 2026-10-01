"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import { saveBankTransferSettings, type BankTransferSettings } from "@/app/admin/settings/bank-actions";
import MathSubmitButton from "@/components/ui/MathSubmitButton";

export default function BankTransferSettingsForm({
  initialSettings,
}: {
  initialSettings: BankTransferSettings;
}) {
  const router = useRouter();
  const [isSaving, startSaving] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    const formData = new FormData(event.currentTarget);

    startSaving(async () => {
      const result = await saveBankTransferSettings(formData);
      if ("error" in result) {
        setMessage(result.error);
        return;
      }
      setMessage("Banka bilgileri kaydedildi.");
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-4">
      <div>
        <label className="label" htmlFor="bank-name">Banka</label>
        <input id="bank-name" name="bank_name" className="input" required defaultValue={initialSettings.bankName} />
      </div>
      <div>
        <label className="label" htmlFor="bank-account-holder">Hesap sahibi</label>
        <input
          id="bank-account-holder"
          name="account_holder"
          className="input"
          required
          defaultValue={initialSettings.accountHolder}
        />
      </div>
      <div>
        <label className="label" htmlFor="bank-iban">IBAN</label>
        <input
          id="bank-iban"
          name="iban"
          className="input"
          autoComplete="off"
          placeholder="TR00 0000 0000 0000 0000 0000 00"
          required
          defaultValue={initialSettings.iban}
        />
      </div>
      {message && <p className={`text-sm ${message.includes("kaydedildi") ? "text-green-600" : "text-red-600"}`}>{message}</p>}
      <MathSubmitButton
        type="submit"
        loading={isSaving}
        pendingText="Kaydediliyor..."
        className="btn-primary inline-flex items-center gap-2"
      >
        <Save className="h-4 w-4" /> Kaydet
      </MathSubmitButton>
    </form>
  );
}