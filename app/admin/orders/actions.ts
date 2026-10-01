"use server";

import { addMonths } from "date-fns";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/require-admin";
import { revalidatePath } from "next/cache";

export type OrderActionResult = { error: string } | { success: true };

export async function approveOrder(orderId: string): Promise<OrderActionResult> {
  const guard = await requireAdmin();
  if (!guard.ok) return { error: guard.error };

  const supabase = createAdminClient();
  const { data: order } = await supabase
    .from("orders")
    .select("id, student_id, product_name, package_duration_months, receipt_path")
    .eq("id", orderId)
    .eq("status", "pending")
    .single<{
      id: string;
      student_id: string | null;
      product_name: string | null;
      package_duration_months: number | null;
      receipt_path: string | null;
    }>();

  if (!order || !order.student_id) return { error: "Bekleyen sipariş bulunamadı." };
  if (!order.receipt_path) return { error: "Ödeme onayı için dekont yüklenmiş olmalı." };

  const paidAt = new Date();
  const packageExpiresAt = order.package_duration_months
    ? addMonths(paidAt, order.package_duration_months).toISOString()
    : null;

  const { data: updatedOrder, error } = await supabase
    .from("orders")
    .update({ status: "paid", paid_at: paidAt.toISOString(), package_expires_at: packageExpiresAt })
    .eq("id", order.id)
    .eq("status", "pending")
    .select("id")
    .maybeSingle<{ id: string }>();

  if (error || !updatedOrder) {
    console.error("Sipariş onaylanamadı:", error);
    if (error?.message.includes("DISCOUNT_CODE_LIMIT_REACHED")) {
      return { error: "Bu indirim kodunun kullanım limiti dolmuş. Siparişi ayrıca kontrol et." };
    }
    return { error: "Sipariş onaylanamadı veya daha önce işlenmiş." };
  }

  await supabase.from("notifications").insert({
    recipient_id: order.student_id,
    channel: "in_app",
    title: "Ödemen onaylandı",
    body: `${order.product_name || "Ders paketin"} hesabına tanımlandı.`,
    link: "/student/packages",
  });

  revalidatePath("/admin/orders");
  revalidatePath("/admin/discounts");
  revalidatePath("/student/packages");
  revalidatePath("/student/dashboard");
  return { success: true };
}