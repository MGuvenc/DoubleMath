"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/require-admin";
import { revalidatePath } from "next/cache";

export type SettingsActionResult = { error: string } | { success: true };
export type SyncResult = { error: string } | { success: true; count: number };

export async function getInstagramSettings(): Promise<{
  accessToken: string;
  businessAccountId: string;
  lastSyncCount: number;
}> {
  const guard = await requireAdmin();
  if (!guard.ok) return { accessToken: "", businessAccountId: "", lastSyncCount: 0 };

  const adminSupabase = createAdminClient();
  const { data: rows } = await adminSupabase
    .from("site_settings")
    .select("key, value")
    .in("key", ["instagram_access_token", "instagram_business_account_id"])
    .returns<{ key: string; value: string | null }[]>();

  const { count } = await adminSupabase
    .from("instagram_posts")
    .select("id", { count: "exact", head: true });

  const map = new Map((rows || []).map((r) => [r.key, r.value || ""]));

  return {
    accessToken: map.get("instagram_access_token") || "",
    businessAccountId: map.get("instagram_business_account_id") || "",
    lastSyncCount: count || 0,
  };
}

export async function saveInstagramSettings(formData: FormData): Promise<SettingsActionResult> {
  const guard = await requireAdmin();
  if (!guard.ok) return { error: guard.error };

  const accessToken = (formData.get("access_token") as string) || "";
  const businessAccountId = (formData.get("business_account_id") as string) || "";

  const adminSupabase = createAdminClient();

  const { error: e1 } = await adminSupabase
    .from("site_settings")
    .upsert({ key: "instagram_access_token", value: accessToken, updated_at: new Date().toISOString() });
  const { error: e2 } = await adminSupabase
    .from("site_settings")
    .upsert({
      key: "instagram_business_account_id",
      value: businessAccountId,
      updated_at: new Date().toISOString(),
    });

  if (e1 || e2) {
    console.error("Ayarlar kaydedilemedi:", e1 || e2);
    return { error: "Ayarlar kaydedilemedi." };
  }

  revalidatePath("/admin/settings");
  return { success: true };
}

export async function syncInstagramPosts(): Promise<SyncResult> {
  const guard = await requireAdmin();
  if (!guard.ok) return { error: guard.error };

  const adminSupabase = createAdminClient();
  const { data: rows } = await adminSupabase
    .from("site_settings")
    .select("key, value")
    .in("key", ["instagram_access_token", "instagram_business_account_id"])
    .returns<{ key: string; value: string | null }[]>();

  const map = new Map((rows || []).map((r) => [r.key, r.value || ""]));
  const token = map.get("instagram_access_token");
  const businessId = map.get("instagram_business_account_id");

  if (!token || !businessId) {
    return { error: "Önce Instagram Access Token ve Business Account ID'yi kaydet." };
  }

  try {
    const url = `https://graph.facebook.com/v19.0/${businessId}/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp&access_token=${encodeURIComponent(
      token
    )}&limit=12`;

    const res = await fetch(url);
    const json = await res.json();

    if (json.error) {
      console.error("Instagram API hatası:", json.error);
      return { error: `Instagram API hatası: ${json.error.message}` };
    }

    const posts: Array<{
      id: string;
      caption?: string;
      media_type: string;
      media_url: string;
      thumbnail_url?: string;
      permalink: string;
      timestamp: string;
    }> = json.data || [];

    for (const post of posts) {
      await adminSupabase.from("instagram_posts").upsert({
        id: post.id,
        media_type: post.media_type,
        media_url: post.media_url,
        thumbnail_url: post.thumbnail_url || null,
        permalink: post.permalink,
        caption: post.caption || null,
        timestamp: post.timestamp,
        cached_at: new Date().toISOString(),
      });
    }

    revalidatePath("/instagram");
    revalidatePath("/admin/settings");
    return { success: true, count: posts.length };
  } catch (e) {
    console.error("Instagram senkronizasyonu başarısız:", e);
    return { error: "Instagram'a bağlanılamadı. Token/ID'yi kontrol et." };
  }
}