import { createClient } from "./server";

export type AdminGuardResult = { ok: true; userId: string } | { ok: false; error: string };

export async function requireAdmin(): Promise<AdminGuardResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false, error: "Giriş yapmalısın." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single<{ role: string }>();

  if (profile?.role !== "admin") return { ok: false, error: "Bu işlem için yetkin yok." };

  return { ok: true, userId: user.id };
}