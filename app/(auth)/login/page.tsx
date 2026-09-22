"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import GoogleAuthButton from "@/components/marketing/GoogleAuthButton";
import type { ProfileRoleRow } from "@/lib/supabase/query-types";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(
    searchParams.get("error") === "oauth" ? "Google ile giriş başarısız oldu, tekrar dene." : null
  );
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error || !data.user) {
      setError("E-posta veya şifre hatalı.");
      setLoading(false);
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .single<ProfileRoleRow>();

    if (profileError || !profile) {
      setError("Profil bilgisi alınamadı, tekrar dene.");
      setLoading(false);
      return;
    }

    const redirect = searchParams.get("redirect");
    const defaultPath = profile.role === "admin" ? "/admin/dashboard" : "/student/dashboard";

    // Not: Burada router.push yerine bilinçli olarak tam sayfa yenilemesi (window.location)
    // kullanıyoruz. Sebep: signInWithPassword döndüğü anda tarayıcıya session cookie'si
    // yazılması küçük bir gecikmeyle (bir sonraki event-loop turunda) tamamlanabiliyor.
    // router.push ile yapılan client-side geçiş, middleware'e bu cookie henüz yazılmadan
    // giden bir istek gönderebiliyor ve bu da middleware'in eski/boş rolü görüp yanlış
    // panele yönlendirmesine (ya da "biraz bekleyince düzelmesine") sebep oluyordu.
    // window.location.href tam bir tarayıcı navigasyonu başlattığı için cookie kesinlikle
    // yazıldıktan sonra yeni bir istek atar, middleware her zaman güncel rolü görür.
    window.location.href = redirect || defaultPath;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm card">
        <h1 className="text-xl font-bold text-slate-900">Giriş Yap</h1>
        <p className="mt-1 text-sm text-slate-600">Hesabına giriş yaparak devam et.</p>

        <div className="mt-6">
          <GoogleAuthButton />
        </div>

        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-slate-200" />
          <span className="text-xs text-slate-400">veya e-posta ile</span>
          <div className="h-px flex-1 bg-slate-200" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">E-posta</label>
            <input
              type="email"
              required
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Şifre</label>
            <input
              type="password"
              required
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
          Hesabın yok mu?{" "}
          <Link href="/register" className="font-medium text-brand-600 hover:underline">
            Kayıt ol
          </Link>
        </p>
      </div>
    </div>
  );
}
