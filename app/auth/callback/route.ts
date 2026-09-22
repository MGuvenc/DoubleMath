import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { ProfileRoleRow } from "@/lib/supabase/query-types";

// Google (veya ileride eklenecek başka OAuth sağlayıcıları) girişinden sonra
// Supabase kullanıcıyı bu route'a ?code=... parametresiyle geri gönderir.
// Burada code, gerçek bir oturuma (session) çevrilir.

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const redirectTo = searchParams.get("redirect");

  if (code) {
    const supabase = createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // Rolüne göre doğru panele yönlendir
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .single<ProfileRoleRow>();

      const target =
        redirectTo || (profile?.role === "admin" ? "/admin/dashboard" : "/student/dashboard");

      return NextResponse.redirect(`${origin}${target}`);
    }
  }

  // Hata durumunda giriş sayfasına, açıklamayla geri dön
  return NextResponse.redirect(`${origin}/login?error=oauth`);
}
