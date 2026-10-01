"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { validateFile } from "@/lib/file-validation";

export type CheckoutResult = { error: string } | { success: true };

const RECEIPT_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
const RECEIPT_EXTENSIONS: Record<string, string> = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export async function submitBankTransfer(productId: string, formData: FormData): Promise<CheckoutResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sipariş vermek için giriş yapmalısın." };

  const [{ data: profile }, { data: product }] = await Promise.all([
    supabase
      .from("profiles")
      .select("role, full_name, email, phone")
      .eq("id", user.id)
      .single<{ role: string; full_name: string; email: string; phone: string | null }>(),
    supabase
      .from("products")
      .select("id, name, price, duration_months, type, is_active")
      .eq("id", productId)
      .single<{
        id: string;
        name: string;
        price: number;
        duration_months: number | null;
        type: string;
        is_active: boolean;
      }>(),
  ]);

  if (profile?.role !== "student") return { error: "Bu işlem öğrenci hesabıyla yapılabilir." };
  if (!product || !product.is_active || product.type !== "lesson_package") {
    return { error: "Bu paket artık satın alınamıyor." };
  }

  const receipt = formData.get("receipt");
  if (!(receipt instanceof File) || receipt.size === 0) {
    return { error: "Havale dekontunu PDF veya görsel olarak yükle." };
  }

  const validation = validateFile(receipt, 10 * 1024 * 1024, RECEIPT_TYPES, "10MB");
  if (!validation.valid) return { error: validation.error || "Dekont dosyası geçersiz." };

  const adminSupabase = createAdminClient();
  const { data: order, error: orderError } = await adminSupabase
    .from("orders")
    .insert({
      student_id: user.id,
      product_id: product.id,
      product_name: product.name,
      package_duration_months: product.duration_months,
      amount: product.price,
      currency: "TRY",
      status: "pending",
      payment_provider: "bank_transfer",
      buyer_name: profile.full_name,
      buyer_email: profile.email || user.email || "",
      buyer_phone: profile.phone,
    })
    .select("id")
    .single<{ id: string }>();

  if (orderError || !order) {
    console.error("Havale siparişi oluşturulamadı:", orderError);
    return { error: "Sipariş oluşturulamadı. Lütfen tekrar dene." };
  }

  const receiptPath = `${user.id}/${order.id}/${Date.now()}.${RECEIPT_EXTENSIONS[receipt.type]}`;
  const { error: uploadError } = await adminSupabase.storage
    .from("order-receipts")
    .upload(receiptPath, receipt, { contentType: receipt.type, upsert: false });

  if (uploadError) {
    await adminSupabase.from("orders").delete().eq("id", order.id);
    console.error("Havale dekontu yüklenemedi:", uploadError);
    return { error: "Dekont yüklenemedi. Lütfen tekrar dene." };
  }

  const { error: receiptError } = await adminSupabase
    .from("orders")
    .update({ receipt_path: receiptPath })
    .eq("id", order.id);

  if (receiptError) {
    await adminSupabase.storage.from("order-receipts").remove([receiptPath]);
    await adminSupabase.from("orders").delete().eq("id", order.id);
    console.error("Dekont siparişe bağlanamadı:", receiptError);
    return { error: "Dekont siparişe kaydedilemedi. Lütfen tekrar dene." };
  }

  const { data: admins } = await adminSupabase
    .from("profiles")
    .select("id")
    .eq("role", "admin")
    .returns<{ id: string }[]>();

  if (admins?.length) {
    await adminSupabase.from("notifications").insert(
      admins.map((admin) => ({
        recipient_id: admin.id,
        channel: "in_app" as const,
        title: "Yeni havale dekontu",
        body: `${profile.full_name} - ${product.name}`,
        link: "/admin/orders",
      }))
    );
  }

  revalidatePath("/student/packages");
  revalidatePath("/admin/orders");
  return { success: true };
}