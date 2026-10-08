"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import MathSubmitButton from "@/components/ui/MathSubmitButton";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="card w-full max-w-sm text-center text-sm text-slate-600">
          Şifre yenileme ekranı yükleniyor...
        </div>
      </main>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [hasRecoverySession, setHasRecoverySession] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const linkExpired = searchParams.get("error") === "expired";

  useEffect(() => {
    let active = true;
    const supabase = createClient();
    supabase.auth.getUser().then(({ data, error: userError }) => {
      if (!active) return;
      setHasRecoverySession(!userError && Boolean(data.user));
      setCheckingSession(false);
    });

    return () => {
      active = false;
    };
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("Şifre en az 6 karakter olmalı.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Şifreler eşleşmiyor.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      console.error("Şifre yenilenemedi:", updateError);
      setError("Şifren yenilenemedi. Bağlantının süresi dolmuş olabilir; yeni bağlantı iste.");
      setLoading(false);
      return;
    }

    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) {
      console.error("Şifre değişikliğinden sonra oturum kapatılamadı:", signOutError);
      setError("Şifren güncellendi ancak oturum kapatılamadı. Giriş ekranına yönlendiriliyorsun.");
    }
    setSuccess(true);
    setLoading(false);
    router.replace("/login?password-updated=1");
  }

  if (checkingSession) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="card w-full max-w-sm text-center text-sm text-slate-600">
          Bağlantı kontrol ediliyor...
        </div>
      </main>
    );
  }

  if (linkExpired || !hasRecoverySession) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="card w-full max-w-sm text-center">
          <h1 className="text-xl font-bold text-slate-900">
            {linkExpired ? "Bağlantının süresi dolmuş" : "Geçerli bağlantı bulunamadı"}
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Şifreni yenilemek için yeni bir bağlantı iste. E-posta bağlantıları 1 saat geçerlidir.
          </p>
          <Link href="/forgot-password" className="btn-primary mt-6 inline-flex">
            Yeni bağlantı iste
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="card w-full max-w-sm">
        <h1 className="text-xl font-bold text-slate-900">Yeni şifre belirle</h1>
        <p className="mt-2 text-sm text-slate-600">Hesabın için yeni bir şifre oluştur.</p>

        {success ? (
          <p role="status" className="mt-4 text-sm text-green-700">
            Şifren güncellendi. Giriş ekranına yönlendiriliyorsun.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="label" htmlFor="new-password">Yeni şifre</label>
              <input
                id="new-password"
                type="password"
                autoComplete="new-password"
                minLength={6}
                required
                className="input"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>
            <div>
              <label className="label" htmlFor="confirm-password">Yeni şifreyi tekrar gir</label>
              <input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                minLength={6}
                required
                className="input"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
              />
            </div>

            {error && <p role="alert" className="text-sm text-red-600">{error}</p>}

            <MathSubmitButton
              type="submit"
              loading={loading}
              pendingText="Şifre güncelleniyor..."
              className="btn-primary w-full"
            >
              Şifremi güncelle
            </MathSubmitButton>
          </form>
        )}
      </div>
    </main>
  );
}
