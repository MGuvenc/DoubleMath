import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { ProfileRoleRow } from "@/lib/supabase/query-types";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isAdminRoute = path.startsWith("/admin");
  const isStudentRoute = path.startsWith("/student");
  const isAuthRoute = path.startsWith("/login") || path.startsWith("/register");

  // Giriş yapılmamışsa korumalı rotalara erişimi engelle
  if (!user && (isAdminRoute || isStudentRoute)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", path);
    return NextResponse.redirect(url);
  }

  // Rol bilgisi bu istekte lazımsa (auth sayfaları, admin ya da student rotası),
  // tek seferde çekip aşağıdaki tüm kontrollerde kullanıyoruz.
  if (user && (isAuthRoute || isAdminRoute || isStudentRoute)) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single<ProfileRoleRow>();

    const homeForRole = profile?.role === "admin" ? "/admin/dashboard" : "/student/dashboard";

    // Giriş yapılmışsa auth sayfalarından uzaklaştır
    if (isAuthRoute) {
      const url = request.nextUrl.clone();
      url.pathname = homeForRole;
      return NextResponse.redirect(url);
    }

    // Admin rotasına öğrenci girmeye çalışırsa engelle
    if (isAdminRoute && profile?.role !== "admin") {
      const url = request.nextUrl.clone();
      url.pathname = "/student/dashboard";
      return NextResponse.redirect(url);
    }

    // Öğrenci rotasına admin girmeye çalışırsa engelle
    if (isStudentRoute && profile?.role === "admin") {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/dashboard";
      return NextResponse.redirect(url);
    }
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*", "/student/:path*", "/login", "/register"],
};
