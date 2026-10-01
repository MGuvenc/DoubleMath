"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/require-admin";
import { revalidatePath } from "next/cache";

export interface BankTransferSettings {
  bankName: string;
  accountHolder: string;
  iban: string;
}

export type BankSettingsResult = { error: string } | { success: true };

export async function getBankTransferSettings(): Promise<BankTransferSettings> {
  const guard = await requireAdmin();
  if (!guard.ok) return { bankName: "", accountHolder: "", iban: "" };

  const { data } = await createAdminClient()
    .from("site_settings")
    .select("key, value")
    .in("key", ["bank_name", "bank_account_holder", "bank_iban"])
    .returns<{ key: string; value: string | null }[]>();

  const settings = new Map((data || []).map((row) => [row.key, row.value || ""]));
  return {
    bankName: settings.get("bank_name") || "",
    accountHolder: settings.get("bank_account_holder") || "",
    iban: settings.get("bank_iban") || "",
  };
}

export async function saveBankTransferSettings(formData: FormData): Promise<BankSettingsResult> {
  const guard = await requireAdmin();
  if (!guard.ok) return { error: guard.error };

  const bankName = ((formData.get("bank_name") as string) || "").trim();
  const accountHolder = ((formData.get("account_holder") as string) || "").trim();
  const iban = ((formData.get("iban") as string) || "").replace(/\s/g, "").toUpperCase();

  if (!bankName || !accountHolder || !/^TR\d{24}$/.test(iban)) {
    return { error: "Banka, hesap sahibi ve geçerli bir TR IBAN gir." };
  }

  const adminSupabase = createAdminClient();
  const updatedAt = new Date().toISOString();
  const { error } = await adminSupabase.from("site_settings").upsert([
    { key: "bank_name", value: bankName, updated_at: updatedAt },
    { key: "bank_account_holder", value: accountHolder, updated_at: updatedAt },
    { key: "bank_iban", value: iban, updated_at: updatedAt },
  ]);

  if (error) {
    console.error("Banka bilgileri kaydedilemedi:", error);
    return { error: "Banka bilgileri kaydedilemedi." };
  }

  revalidatePath("/admin/settings");
  revalidatePath("/checkout", "page");
  return { success: true };
}