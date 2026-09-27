"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/require-admin";

export async function updateContactRequestStatus(formData: FormData): Promise<void> {
  const guard = await requireAdmin();
  if (!guard.ok) return;

  const requestId = formData.get("request_id");
  const handledValue = formData.get("is_handled");
  if (typeof requestId !== "string" || !requestId || !["true", "false"].includes(String(handledValue))) {
    return;
  }

  const supabase = createClient();
  const { error } = await supabase
    .from("contact_requests")
    .update({ is_handled: handledValue === "true" })
    .eq("id", requestId);

  if (error) {
    console.error("İletişim talebi durumu güncellenemedi:", error);
    return;
  }

  revalidatePath("/admin/contact-requests");
}