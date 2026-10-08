"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import MathSubmitButton from "@/components/ui/MathSubmitButton";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const redirectTo = new URL("/auth/callback", window.location.origin);
    redirectTo.searchParams.set("next", "/reset-password");
    redirectTo.searchParams.set("flow", "recovery");

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: redirectTo.toString(),
    });

    if (resetError) {
      console.error("Şifre sıfırlama e-postası gönderilemedi:", resetError);
      setError("E-posta gönderilemedi. Lütfen adresi kontrol edip tekrar dene.");
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="card w-full max-w-sm">
        {sent ? (
          <div role="status" className="text-center">
            <h1 className="text-xl font-bold text-slate-900">E-postanı kontrol et</h1>
            <p className="mt-3 text-sm text-slate-600">
              {email} adresi kayıtlıysa, şifreni yenilemek için bir bağlantı gönderdik.
              Bağlantı 1 saat geçerlidir.
            </p>
            <Link href="/login" className="btn-primary mt-6 inline-flex">
              Giriş ekranına dön
            </Link>
          </div>
        ) : (
          <>
            <h1 className="text-xl font-bold text-slate-900">Şifremi unuttum</h1>
            <p className="mt-2 text-sm text-slate-600">
              Hesabına bağlı e-posta adresini gir. Sana şifreni yenileyebileceğin bir bağlantı gönderelim.
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="label" htmlFor="recovery-email">E-posta</label>
                <input
                  id="recovery-email"
                  type="email"
                  autoComplete="email"
                  required
                  className="input"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </div>

              {error && <p role="alert" className="text-sm text-red-600">{error}</p>}

              <MathSubmitButton
                type="submit"
                loading={loading}
                pendingText="Bağlantı gönderiliyor..."
                className="btn-primary w-full"
              >
                Şifre yenileme bağlantısı gönder
              </MathSubmitButton>
            </form>

            <p className="mt-6 text-center text-sm text-slate-600">
              <Link href="/login" className="font-medium text-brand-700 hover:underline">
                Giriş ekranına dön
              </Link>
            </p>
          </>
        )}
      </div>
    </main>
  );
}
