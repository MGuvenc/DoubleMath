import { NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import type { ProfileRoleRow } from "@/lib/supabase/query-types";

// Google (veya ileride eklenecek başka OAuth sağlayıcıları) girişinden sonra
// Supabase kullanıcıyı bu route'a ?code=... parametresiyle geri gönderir.
// Burada code, gerçek bir oturuma (session) çevrilir.

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const redirectTo = searchParams.get("redirect");
  const isPasswordRecovery =
    searchParams.get("flow") === "recovery" && searchParams.get("next") === "/reset-password";

  if (code) {
    const supabase = createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error && isPasswordRecovery) {
      return NextResponse.redirect(new URL("/reset-password?error=expired", origin));
    }

    if (!error && data.user) {
      if (isPasswordRecovery) {
        return NextResponse.redirect(new URL("/reset-password", origin));
      }

      const email = data.user.email;
      if (!email) return NextResponse.redirect(`${origin}/login?error=oauth`);

      const metadataName = data.user.user_metadata?.full_name || data.user.user_metadata?.name;
      const fullName = typeof metadataName === "string" && metadataName.trim()
        ? metadataName.trim()
        : email.split("@")[0];

      const adminSupabase = createAdminClient();
      const { error: profileUpsertError } = await adminSupabase.from("profiles").upsert(
        {
          id: data.user.id,
          full_name: fullName,
          email,
          role: "student",
        },
        { onConflict: "id", ignoreDuplicates: true }
      );

      if (profileUpsertError) {
        console.error("OAuth profili oluşturulamadı:", profileUpsertError);
        return NextResponse.redirect(`${origin}/login?error=oauth-profile`);
      }

      // Rolüne göre doğru panele yönlendir
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .single<ProfileRoleRow>();

      const safeRedirect = redirectTo?.startsWith("/") && !redirectTo.startsWith("//") ? redirectTo : null;
      const target = safeRedirect || (profile?.role === "admin" ? "/admin/dashboard" : "/student/dashboard");

      return NextResponse.redirect(new URL(target, origin));
    }
  }

  // Hata durumunda giriş sayfasına, açıklamayla geri dön
  return NextResponse.redirect(`${origin}/login?error=oauth`);
}
