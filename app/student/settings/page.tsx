import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AccountCredentialsForm from "@/components/account/AccountCredentialsForm";

export default async function StudentSettingsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Ayarlar</h1>
      <p className="mt-1 text-sm text-slate-500">E-posta adresini ve şifreni buradan güncelleyebilirsin.</p>
      <AccountCredentialsForm currentEmail={user.email || ""} />
    </div>
  );
}
