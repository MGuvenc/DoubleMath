"use server";

import { createClient } from "@/lib/supabase/server";

export type AccountUpdateResult =
  | { error: string }
  | {
      success: true;
      message: string;
      emailChangePending: boolean;
      passwordUpdated: boolean;
    };

export async function updateAccountCredentials(
  formData: FormData
): Promise<AccountUpdateResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Bu işlemi yapmak için tekrar giriş yapmalısın." };

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle<{ role: string }>();

  if (profileError) {
    console.error("Hesap rolü kontrol edilemedi:", profileError);
    return { error: "Hesap bilgileri doğrulanamadı. Lütfen tekrar dene." };
  }
  if (profile?.role !== "student" && profile?.role !== "admin") {
    return { error: "Bu hesap için değişiklik yapılamıyor." };
  }

  const emailValue = formData.get("email");
  const passwordValue = formData.get("password");
  const confirmPasswordValue = formData.get("confirm_password");
  if (
    (emailValue !== null && typeof emailValue !== "string") ||
    (passwordValue !== null && typeof passwordValue !== "string") ||
    (confirmPasswordValue !== null && typeof confirmPasswordValue !== "string")
  ) {
    return { error: "Form bilgileri geçersiz." };
  }

  const email = typeof emailValue === "string" ? emailValue.trim().toLowerCase() : "";
  const password = typeof passwordValue === "string" ? passwordValue : "";
  const confirmPassword =
    typeof confirmPasswordValue === "string" ? confirmPasswordValue : "";
  const emailChanged = Boolean(email && email !== user.email?.toLowerCase());
  const passwordUpdated = Boolean(password);

  if (!emailChanged && !passwordUpdated) {
    return { error: "Değiştirmek istediğin e-posta adresini veya yeni şifreni gir." };
  }
  if (emailChanged && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Geçerli bir e-posta adresi gir." };
  }
  if (passwordUpdated && password.length < 6) {
    return { error: "Yeni şifre en az 6 karakter olmalı." };
  }
  if (passwordUpdated && password !== confirmPassword) {
    return { error: "Yeni şifreler eşleşmiyor." };
  }
  if (!passwordUpdated && confirmPassword) {
    return { error: "Yeni şifreyi de girmelisin." };
  }

  const { error } = await supabase.auth.updateUser({
    ...(emailChanged ? { email } : {}),
    ...(passwordUpdated ? { password } : {}),
  });

  if (error) {
    console.error("Hesap bilgileri güncellenemedi:", error);
    return { error: "Hesap bilgileri güncellenemedi. E-posta adresini kontrol edip tekrar dene." };
  }

  const emailChangePending = emailChanged;
  const message = [
    passwordUpdated ? "Şifren güncellendi." : "",
    emailChangePending
      ? "E-posta değişikliğini tamamlamak için yeni adresine gönderilen doğrulama bağlantısına tıkla."
      : "",
  ]
    .filter(Boolean)
    .join(" ");

  return { success: true, message, emailChangePending, passwordUpdated };
}
