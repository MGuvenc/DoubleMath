"use client";

import { useState, useTransition } from "react";
import { updateAccountCredentials } from "@/app/account-settings/actions";
import MathSubmitButton from "@/components/ui/MathSubmitButton";

export default function AccountCredentialsForm({
  currentEmail,
}: {
  currentEmail: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [emailConfirmationPending, setEmailConfirmationPending] = useState(false);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    const form = event.currentTarget;
    const formData = new FormData(form);

    startTransition(async () => {
      const result = await updateAccountCredentials(formData);
      if ("error" in result) {
        setError(result.error);
        return;
      }

      setMessage(result.message);
      setEmailConfirmationPending(result.emailChangePending);
      form.reset();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="card mt-4 max-w-2xl space-y-4">
      <div>
        <label className="label" htmlFor="account-email">E-posta adresi</label>
        <input
          id="account-email"
          type="email"
          name="email"
          defaultValue={currentEmail}
          autoComplete="email"
          required
          className="input"
        />
        <p className="mt-1 text-xs text-slate-500">
          E-posta değişikliğini tamamlamak için yeni adresine gönderilen doğrulama bağlantısına tıklaman gerekir.
        </p>
      </div>

      <div className="border-t border-slate-100 pt-4">
        <label className="label" htmlFor="account-password">Yeni şifre</label>
        <input
          id="account-password"
          type="password"
          name="password"
          minLength={6}
          autoComplete="new-password"
          placeholder="Değiştirmek istemiyorsan boş bırak"
          className="input"
        />
      </div>

      <div>
        <label className="label" htmlFor="account-confirm-password">Yeni şifreyi tekrar gir</label>
        <input
          id="account-confirm-password"
          type="password"
          name="confirm_password"
          minLength={6}
          autoComplete="new-password"
          className="input"
        />
      </div>

      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      {message && (
        <p
          role="status"
          className={`text-sm ${emailConfirmationPending ? "text-amber-700" : "text-green-700"}`}
        >
          {message}
        </p>
      )}

      <MathSubmitButton
        type="submit"
        loading={isPending}
        pendingText="Hesap bilgileri güncelleniyor..."
        className="btn-primary"
      >
        Değişiklikleri Kaydet
      </MathSubmitButton>
    </form>
  );
}
