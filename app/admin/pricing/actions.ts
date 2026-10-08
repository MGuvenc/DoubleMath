"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type ProductActionResult = { error: string } | { success: true };

function readSortOrder(formData: FormData): number | null {
  const value = Number(formData.get("sort_order"));
  return Number.isInteger(value) && value >= 0 ? value : null;
}

export async function createProduct(formData: FormData): Promise<ProductActionResult> {
  const supabase = createClient();

  const name = formData.get("name") as string;
  const description = (formData.get("description") as string) || null;
  const price = Number(formData.get("price"));
  const lessonCountRaw = formData.get("lesson_count") as string;
  const lessonCount = lessonCountRaw ? Number(lessonCountRaw) : null;
  const durationMonthsRaw = formData.get("duration_months") as string;
  const durationMonths = durationMonthsRaw ? Number(durationMonthsRaw) : null;
  const pricingUnit = formData.get("pricing_unit") as "hourly" | "monthly" | "one_time";
  const features = (formData.get("features") as string) || null;
  const type = formData.get("type") as "lesson_package" | "book" | "other";
  const sortOrder = readSortOrder(formData);

  if (!name || !price || price <= 0) {
    return { error: "Paket adı ve geçerli bir fiyat girmelisin." };
  }
  if (!["lesson_package", "book", "other"].includes(type)) {
    return { error: "Ürün türü geçersiz." };
  }
  if (sortOrder === null) return { error: "Sıralama 0 veya daha büyük bir tam sayı olmalı." };

  const { error } = await supabase.from("products").insert({
    type,
    name,
    description,
    price,
    lesson_count: lessonCount,
    duration_months: durationMonths,
    pricing_unit: pricingUnit,
    features,
    sort_order: sortOrder,
    is_active: true,
  });

  if (error) {
    console.error("Paket oluşturulamadı:", error);
    return { error: `Paket oluşturulamadı: ${error.message}` };
  }

  revalidatePath("/admin/pricing");
  revalidatePath("/pricing");
  return { success: true };
}

export async function updateProduct(productId: string, formData: FormData): Promise<ProductActionResult> {
  const supabase = createClient();

  const name = formData.get("name") as string;
  const description = (formData.get("description") as string) || null;
  const price = Number(formData.get("price"));
  const lessonCountRaw = formData.get("lesson_count") as string;
  const lessonCount = lessonCountRaw ? Number(lessonCountRaw) : null;
  const durationMonthsRaw = formData.get("duration_months") as string;
  const durationMonths = durationMonthsRaw ? Number(durationMonthsRaw) : null;
  const pricingUnit = formData.get("pricing_unit") as "hourly" | "monthly" | "one_time";
  const features = (formData.get("features") as string) || null;
  const type = formData.get("type") as "lesson_package" | "book" | "other";
  const sortOrder = readSortOrder(formData);

  if (!name || !price || price <= 0) {
    return { error: "Paket adı ve geçerli bir fiyat girmelisin." };
  }
  if (!["lesson_package", "book", "other"].includes(type)) {
    return { error: "Ürün türü geçersiz." };
  }
  if (sortOrder === null) return { error: "Sıralama 0 veya daha büyük bir tam sayı olmalı." };

  const { error } = await supabase
    .from("products")
    .update({
      type,
      name,
      description,
      price,
      lesson_count: lessonCount,
      duration_months: durationMonths,
      pricing_unit: pricingUnit,
      features,
      sort_order: sortOrder,
    })
    .eq("id", productId);

  if (error) {
    console.error("Paket güncellenemedi:", error);
    return { error: `Paket güncellenemedi: ${error.message}` };
  }

  revalidatePath("/admin/pricing");
  revalidatePath("/pricing");
  return { success: true };
}

export async function toggleProductActive(productId: string, isActive: boolean): Promise<ProductActionResult> {
  const supabase = createClient();
  const { error } = await supabase.from("products").update({ is_active: isActive }).eq("id", productId);
  if (error) return { error: `Durum güncellenemedi: ${error.message}` };
  revalidatePath("/admin/pricing");
  revalidatePath("/pricing");
  return { success: true };
}

export async function deleteProduct(productId: string): Promise<ProductActionResult> {
  const supabase = createClient();
  const { error } = await supabase.from("products").delete().eq("id", productId);
  if (error) return { error: `Paket silinemedi: ${error.message}` };
  revalidatePath("/admin/pricing");
  revalidatePath("/pricing");
  return { success: true };
}