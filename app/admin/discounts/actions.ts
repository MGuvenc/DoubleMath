"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/require-admin";
import { revalidatePath } from "next/cache";

export type DiscountActionResult = { error: string } | { success: true };

interface ParsedDiscount {
  code: string;
  discount_type: "percent" | "fixed";
  amount: number;
  max_uses: number | null;
  valid_from: string;
  valid_until: string | null;
}

function parseDiscount(formData: FormData): ParsedDiscount | { error: string } {
  const code = ((formData.get("code") as string) || "").trim().toUpperCase();
  const discountType = formData.get("discount_type");
  const amount = Number(formData.get("amount"));
  const maxUsesRaw = ((formData.get("max_uses") as string) || "").trim();
  const maxUses = maxUsesRaw ? Number(maxUsesRaw) : null;
  const validFromRaw = ((formData.get("valid_from") as string) || "").trim();
  const validUntilRaw = ((formData.get("valid_until") as string) || "").trim();

  if (!/^[A-Z0-9_-]{3,32}$/.test(code)) {
    return { error: "Kod 3-32 karakter olmalı; yalnızca harf, rakam, tire ve alt çizgi kullan." };
  }
  if (discountType !== "percent" && discountType !== "fixed") return { error: "İndirim türü geçersiz." };
  if (!Number.isFinite(amount) || amount <= 0 || (discountType === "percent" && amount > 100)) {
    return { error: discountType === "percent" ? "Yüzde indirim 1-100 arasında olmalı." : "İndirim tutarı sıfırdan büyük olmalı." };
  }
  if (maxUses !== null && (!Number.isInteger(maxUses) || maxUses < 1)) {
    return { error: "Kullanım limiti pozitif tam sayı olmalı." };
  }
  if (!validFromRaw || !/^\d{4}-\d{2}-\d{2}$/.test(validFromRaw)) return { error: "Başlangıç tarihi gir." };
  if (validUntilRaw && !/^\d{4}-\d{2}-\d{2}$/.test(validUntilRaw)) return { error: "Bitiş tarihi geçersiz." };

  const validFrom = new Date(`${validFromRaw}T00:00:00+03:00`);
  const validUntil = validUntilRaw ? new Date(`${validUntilRaw}T23:59:59+03:00`) : null;
  if (Number.isNaN(validFrom.getTime()) || (validUntil && Number.isNaN(validUntil.getTime()))) {
    return { error: "Geçerli tarihler gir." };
  }
  if (validUntil && validUntil < validFrom) return { error: "Bitiş tarihi başlangıç tarihinden önce olamaz." };

  return {
    code,
    discount_type: discountType,
    amount,
    max_uses: maxUses,
    valid_from: validFrom.toISOString(),
    valid_until: validUntil?.toISOString() || null,
  };
}

export async function createDiscountCode(formData: FormData): Promise<DiscountActionResult> {
  const guard = await requireAdmin();
  if (!guard.ok) return { error: guard.error };

  const values = parseDiscount(formData);
  if ("error" in values) return values;

  const { error } = await createAdminClient().from("discount_codes").insert({ ...values, is_active: true });
  if (error) {
    console.error("İndirim kodu oluşturulamadı:", error);
    return { error: error.code === "23505" ? "Bu indirim kodu zaten kayıtlı." : "İndirim kodu oluşturulamadı." };
  }

  revalidatePath("/admin/discounts");
  return { success: true };
}

export async function updateDiscountCode(id: string, formData: FormData): Promise<DiscountActionResult> {
  const guard = await requireAdmin();
  if (!guard.ok) return { error: guard.error };

  const values = parseDiscount(formData);
  if ("error" in values) return values;

  const supabase = createAdminClient();
  const { data: currentCode, error: lookupError } = await supabase
    .from("discount_codes")
    .select("used_count")
    .eq("id", id)
    .maybeSingle<{ used_count: number }>();
  if (lookupError || !currentCode) return { error: "İndirim kodu bulunamadı." };
  if (values.max_uses !== null && values.max_uses < currentCode.used_count) {
    return { error: `Kullanım limiti mevcut kullanım sayısından (${currentCode.used_count}) az olamaz.` };
  }

  const { error } = await supabase.from("discount_codes").update(values).eq("id", id);
  if (error) {
    console.error("İndirim kodu güncellenemedi:", error);
    return { error: error.code === "23505" ? "Bu indirim kodu zaten kayıtlı." : "İndirim kodu güncellenemedi." };
  }

  revalidatePath("/admin/discounts");
  return { success: true };
}

export async function toggleDiscountCode(id: string, isActive: boolean): Promise<DiscountActionResult> {
  const guard = await requireAdmin();
  if (!guard.ok) return { error: guard.error };

  const { error } = await createAdminClient().from("discount_codes").update({ is_active: isActive }).eq("id", id);
  if (error) {
    console.error("İndirim kodu durumu değiştirilemedi:", error);
    return { error: "İndirim kodunun durumu değiştirilemedi." };
  }

  revalidatePath("/admin/discounts");
  return { success: true };
}