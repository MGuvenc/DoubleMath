"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { validateFile } from "@/lib/file-validation";

export type CheckoutResult = { error: string } | { success: true };
export type DiscountPreviewResult =
  | { error: string }
  | { success: true; code: string; discountAmount: number; finalAmount: number };

interface ApplicableDiscountCode {
  id: string;
  code: string;
  discount_type: "percent" | "fixed";
  amount: number;
  max_uses: number | null;
  used_count: number;
  valid_from: string;
  valid_until: string | null;
  is_active: boolean;
}

type CalculatedDiscount =
  | { error: string }
  | { discountCodeId: string; code: string; discountAmount: number; finalAmount: number };

async function calculateDiscount(
  codeValue: string,
  productPrice: number,
  supabase: ReturnType<typeof createAdminClient>
): Promise<CalculatedDiscount> {
  const code = codeValue.trim().toUpperCase();
  if (!/^[A-Z0-9_-]{3,32}$/.test(code)) return { error: "İndirim kodu biçimi geçersiz." };

  const { data: discount } = await supabase
    .from("discount_codes")
    .select("id, code, discount_type, amount, max_uses, used_count, valid_from, valid_until, is_active")
    .eq("code", code)
    .maybeSingle<ApplicableDiscountCode>();

  if (!discount || !discount.is_active) return { error: "Bu indirim kodu kullanılamıyor." };
  const now = Date.now();
  if (new Date(discount.valid_from).getTime() > now) return { error: "Bu indirim kodu henüz geçerli değil." };
  if (discount.valid_until && new Date(discount.valid_until).getTime() < now) {
    return { error: "Bu indirim kodunun süresi dolmuş." };
  }
  if (discount.max_uses !== null && discount.used_count >= discount.max_uses) {
    return { error: "Bu indirim kodunun kullanım limiti dolmuş." };
  }

  const rawDiscount = discount.discount_type === "percent"
    ? productPrice * discount.amount / 100
    : discount.amount;
  const discountAmount = Math.round(Math.min(productPrice, rawDiscount) * 100) / 100;

  return {
    discountCodeId: discount.id,
    code: discount.code,
    discountAmount,
    finalAmount: Math.round((productPrice - discountAmount) * 100) / 100,
  };
}

export async function previewDiscountCode(productId: string, code: string): Promise<DiscountPreviewResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "İndirim kodu kullanmak için giriş yapmalısın." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle<{ role: string }>();
  if (profile?.role !== "student") return { error: "Bu indirim öğrenci hesaplarında kullanılabilir." };

  const { data: product } = await supabase
    .from("products")
    .select("price, type, is_active")
    .eq("id", productId)
    .maybeSingle<{ price: number; type: string; is_active: boolean }>();
  if (!product || product.type !== "lesson_package" || !product.is_active) {
    return { error: "Bu paket için indirim uygulanamıyor." };
  }

  const discount = await calculateDiscount(code, product.price, createAdminClient());
  if ("error" in discount) return { error: discount.error };
  return {
    success: true,
    code: discount.code,
    discountAmount: discount.discountAmount,
    finalAmount: discount.finalAmount,
  };
}

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

  const discountCodeValue = ((formData.get("discount_code") as string) || "").trim();
  const adminSupabase = createAdminClient();
  const discount = discountCodeValue
    ? await calculateDiscount(discountCodeValue, product.price, adminSupabase)
    : null;
  if (discount && "error" in discount) return { error: discount.error };

  const receipt = formData.get("receipt");
  if (!(receipt instanceof File) || receipt.size === 0) {
    return { error: "Havale dekontunu PDF veya görsel olarak yükle." };
  }

  const validation = validateFile(receipt, 10 * 1024 * 1024, RECEIPT_TYPES, "10MB");
  if (!validation.valid) return { error: validation.error || "Dekont dosyası geçersiz." };

  const { data: order, error: orderError } = await adminSupabase
    .from("orders")
    .insert({
      student_id: user.id,
      product_id: product.id,
      discount_code_id: discount && "discountCodeId" in discount ? discount.discountCodeId : null,
      product_name: product.name,
      package_duration_months: product.duration_months,
      amount: discount && "finalAmount" in discount ? discount.finalAmount : product.price,
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