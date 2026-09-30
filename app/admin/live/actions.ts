"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/require-admin";

export type LiveSessionActionResult = { error: string } | { success: true };

function toTurkeyIso(value: string) {
  return new Date(`${value}:00+03:00`).toISOString();
}

export async function createLiveSession(formData: FormData): Promise<LiveSessionActionResult> {
  const admin = await requireAdmin();
  if (!admin.ok) return { error: admin.error };

  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim() || null;
  const startsAtInput = String(formData.get("starts_at") || "");
  const durationMinutes = Number(formData.get("duration_minutes") || 60);

  if (!title || title.length > 120 || !startsAtInput) {
    return { error: "Başlık (en fazla 120 karakter) ve tarih/saat zorunludur." };
  }
  if (!Number.isInteger(durationMinutes) || durationMinutes < 15 || durationMinutes > 240) {
    return { error: "Ders süresi 15 ile 240 dakika arasında olmalıdır." };
  }

  const startsAt = toTurkeyIso(startsAtInput);
  if (Number.isNaN(Date.parse(startsAt))) return { error: "Geçerli bir tarih ve saat gir." };

  const supabase = createClient();
  const { error } = await supabase.from("live_sessions").insert({
    title,
    description,
    starts_at: startsAt,
    duration_minutes: durationMinutes,
    room_name: `doublemath-${randomUUID()}`,
    created_by: admin.userId,
  });

  if (error) {
    console.error("Canlı ders oluşturulamadı:", error);
    return { error: "Canlı ders planlanamadı." };
  }

  revalidatePath("/admin/live");
  revalidatePath("/student/live");
  return { success: true };
}

export async function startLiveSession(sessionId: string): Promise<LiveSessionActionResult> {
  const admin = await requireAdmin();
  if (!admin.ok) return { error: admin.error };

  const supabase = createClient();
  const { error } = await supabase
    .from("live_sessions")
    .update({ status: "live", started_at: new Date().toISOString(), ended_at: null })
    .eq("id", sessionId)
    .eq("status", "scheduled");

  if (error) return { error: "Canlı ders başlatılamadı." };

  revalidatePath("/admin/live");
  revalidatePath("/student/live");
  revalidatePath(`/admin/live/${sessionId}`);
  revalidatePath(`/student/live/${sessionId}`);
  return { success: true };
}

export async function endLiveSession(sessionId: string): Promise<LiveSessionActionResult> {
  const admin = await requireAdmin();
  if (!admin.ok) return { error: admin.error };

  const supabase = createClient();
  const { error } = await supabase
    .from("live_sessions")
    .update({ status: "ended", ended_at: new Date().toISOString() })
    .eq("id", sessionId)
    .eq("status", "live");

  if (error) return { error: "Canlı ders bitirilemedi." };

  revalidatePath("/admin/live");
  revalidatePath("/student/live");
  revalidatePath(`/admin/live/${sessionId}`);
  revalidatePath(`/student/live/${sessionId}`);
  return { success: true };
}

export async function cancelLiveSession(sessionId: string): Promise<LiveSessionActionResult> {
  const admin = await requireAdmin();
  if (!admin.ok) return { error: admin.error };

  const supabase = createClient();
  const { error } = await supabase
    .from("live_sessions")
    .update({ status: "cancelled" })
    .eq("id", sessionId)
    .eq("status", "scheduled");

  if (error) return { error: "Canlı ders iptal edilemedi." };

  revalidatePath("/admin/live");
  revalidatePath("/student/live");
  return { success: true };
}