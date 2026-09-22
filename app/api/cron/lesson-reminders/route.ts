import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { Resend } from "resend";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import type { LessonWithProfileRow } from "@/lib/supabase/query-types";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
  const now = new Date();

  const results = { reminded24h: 0, reminded1h: 0 };

  // ---- 24 saat kala hatırlatma ----
  const in24hStart = new Date(now.getTime() + 23.5 * 60 * 60 * 1000);
  const in24hEnd = new Date(now.getTime() + 24.5 * 60 * 60 * 1000);

  const { data: lessons24h } = await supabase
    .from("lessons")
    .select("*, profiles(full_name, email, email_notifications, push_notifications)")
    .eq("status", "scheduled")
    .eq("reminder_24h_sent", false)
    .gte("starts_at", in24hStart.toISOString())
    .lte("starts_at", in24hEnd.toISOString())
    .returns<LessonWithProfileRow[]>();

  for (const lesson of lessons24h || []) {
    await sendReminder(lesson, "24 saat", resend, supabase);
    await supabase.from("lessons").update({ reminder_24h_sent: true }).eq("id", lesson.id);
    results.reminded24h++;
  }

  // ---- 1 saat kala hatırlatma ----
  const in1hStart = new Date(now.getTime() + 55 * 60 * 1000);
  const in1hEnd = new Date(now.getTime() + 65 * 60 * 1000);

  const { data: lessons1h } = await supabase
    .from("lessons")
    .select("*, profiles(full_name, email, email_notifications, push_notifications)")
    .eq("status", "scheduled")
    .eq("reminder_1h_sent", false)
    .gte("starts_at", in1hStart.toISOString())
    .lte("starts_at", in1hEnd.toISOString())
    .returns<LessonWithProfileRow[]>();

  for (const lesson of lessons1h || []) {
    await sendReminder(lesson, "1 saat", resend, supabase);
    await supabase.from("lessons").update({ reminder_1h_sent: true }).eq("id", lesson.id);
    results.reminded1h++;
  }

  return NextResponse.json({ success: true, ...results });
}

async function sendReminder(lesson: any, label: string, resend: Resend | null, supabase: any) {
  const student = lesson.profiles;
  const formattedTime = format(new Date(lesson.starts_at), "d MMMM EEEE, HH:mm", { locale: tr });

  // Uygulama içi bildirim
  await supabase.from("notifications").insert({
    recipient_id: lesson.student_id,
    channel: "in_app",
    title: `Dersine ${label} kaldı`,
    body: `${formattedTime} tarihindeki matematik dersin yaklaşıyor.`,
    link: "/student/lessons",
  });

  // Email bildirimi
  if (resend && student?.email && student?.email_notifications !== false) {
    try {
      await resend.emails.send({
        from: process.env.EMAIL_FROM || "bildirim@matematikozelders.com",
        to: student.email,
        subject: `Dersine ${label} kaldı — ${formattedTime}`,
        html: `
          <h2>Merhaba ${student.full_name},</h2>
          <p>Matematik dersine <strong>${label}</strong> kaldı.</p>
          <p><strong>Tarih/Saat:</strong> ${formattedTime}</p>
          ${lesson.meeting_url ? `<p><a href="${lesson.meeting_url}">Derse Katıl</a></p>` : ""}
        `,
      });
    } catch (e) {
      console.error("Hatırlatma emaili gönderilemedi:", e);
    }
  }

  // Not: Web push bildirimi eklemek için burada student.push_subscription
  // kullanılarak web-push kütüphanesiyle gönderim yapılabilir (Faz 2).
}
