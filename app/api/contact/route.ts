import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { Resend } from "resend";

export async function POST(request: Request) {
  const body = await request.json();
  const { full_name, email, phone, grade_level, message, package_name } = body;

  if (!full_name || !email) {
    return NextResponse.json({ error: "Ad ve e-posta zorunludur." }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("contact_requests").insert({
    full_name,
    email,
    phone,
    grade_level,
    message,
    package_name: package_name || null,
  });

  if (error) {
    return NextResponse.json({ error: "Kayıt sırasında hata oluştu." }, { status: 500 });
  }

  const { data: admins } = await supabase.from("profiles").select("id").eq("role", "admin").returns<{ id: string }[]>();

  if (admins?.length) {
    await supabase.from("notifications").insert(
      admins.map((admin) => ({
        recipient_id: admin.id,
        channel: "in_app",
        title: "Yeni iletişim talebi",
        body: `${full_name} iletişim formundan yeni mesaj bıraktı.`,
        link: "/admin/contact-requests",
      }))
    );
  }

  // Admin'e bilgilendirme e-postası (Resend API key tanımlıysa)
  if (process.env.RESEND_API_KEY && process.env.ADMIN_EMAIL) {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: process.env.EMAIL_FROM || "bildirim@matematikozelders.com",
        to: process.env.ADMIN_EMAIL,
        subject: `Yeni İletişim Talebi: ${full_name}`,
        html: `
          <h2>Yeni İletişim Formu Talebi</h2>
          <p><strong>Ad Soyad:</strong> ${full_name}</p>
          <p><strong>E-posta:</strong> ${email}</p>
          <p><strong>Telefon:</strong> ${phone || "-"}</p>
          <p><strong>Sınıf/Seviye:</strong> ${grade_level || "-"}</p>
          <p><strong>İlgilendiği Paket:</strong> ${package_name || "-"}</p>
          <p><strong>Mesaj:</strong> ${message || "-"}</p>
        `,
      });
    } catch (e) {
      console.error("Email gönderilemedi:", e);
      // Email hatası kaydı engellemez, sadece loglanır
    }
  }

  return NextResponse.json({ success: true });
}
