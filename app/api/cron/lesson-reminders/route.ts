import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { Resend } from "resend";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import type { LessonWithProfileRow } from "@/lib/supabase/query-types";
import { PACKAGE_ACCESS_GRACE_DAYS } from "@/lib/package-access";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
  const now = new Date();

  const results = {
    reminded24h: 0,
    reminded1h: 0,
    packageExpirationWarnings: 0,
    expiredPackagesReminded: 0,
  };

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

  const warningWindowStart = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
  const warningWindowEnd = new Date(
    now.getTime() + PACKAGE_ACCESS_GRACE_DAYS * 24 * 60 * 60 * 1000
  );
  const { data: expiringOrders, error: expiringOrdersError } = await supabase
    .from("orders")
    .select("id, student_id, product_name, package_expires_at")
    .eq("status", "paid")
    .eq("expiration_warning_sent", false)
    .not("student_id", "is", null)
    .gte("package_expires_at", warningWindowStart.toISOString())
    .lte("package_expires_at", warningWindowEnd.toISOString())
    .order("package_expires_at", { ascending: false })
    .limit(500)
    .returns<ExpiringPackageOrder[]>();

  if (expiringOrdersError) {
    console.error("Paket bitiş uyarıları alınamadı:", expiringOrdersError);
  }

  for (const order of expiringOrders || []) {
    const { data: laterPackages, error: laterPackagesError } = await supabase
      .from("orders")
      .select("id")
      .eq("student_id", order.student_id)
      .eq("status", "paid")
      .or(`package_expires_at.is.null,package_expires_at.gt.${order.package_expires_at}`)
      .limit(1);

    if (laterPackagesError) {
      console.error("Sonraki paket kontrol edilemedi:", laterPackagesError);
      continue;
    }

    if (laterPackages?.length) {
      const { error } = await supabase
        .from("orders")
        .update({ expiration_warning_sent: true })
        .eq("id", order.id);
      if (error) console.error("Eski paket uyarısı güncellenemedi:", error);
      continue;
    }

    const { error: notificationError } = await supabase.from("notifications").insert({
      recipient_id: order.student_id,
      channel: "in_app",
      title: "Paketin bitmek üzere",
      body: `${order.product_name || "Ders paketinin"} süresi yaklaşık 3 gün içinde sona erecek. Erişimin paket bitişinden sonra 3 gün daha devam eder; devam etmek için yeni paketleri inceleyebilirsin.`,
      link: "/student/packages",
    });

    if (notificationError) {
      console.error("Paket bitiş uyarısı kaydedilemedi:", notificationError);
      continue;
    }

    const { error: updateError } = await supabase
      .from("orders")
      .update({ expiration_warning_sent: true })
      .eq("id", order.id);
    if (updateError) {
      console.error("Paket uyarısı gönderim durumu güncellenemedi:", updateError);
      continue;
    }

    results.packageExpirationWarnings++;
  }

  const [{ data: expiredOrders }, { data: admins }] = await Promise.all([
    supabase
      .from("orders")
      .select("id, student_id, product_name, package_expires_at, profiles(full_name, email, email_notifications)")
      .eq("status", "paid")
      .eq("expiration_notified", false)
      .not("package_expires_at", "is", null)
      .lte("package_expires_at", now.toISOString())
      .limit(500)
      .returns<ExpiredPackageOrder[]>(),
    supabase
      .from("profiles")
      .select("id, full_name, email, email_notifications")
      .eq("role", "admin")
      .returns<ReminderRecipient[]>(),
  ]);

  for (const order of expiredOrders || []) {
    const packageName = order.product_name || "Ders paketin";
    const notifications = [
      ...(order.student_id
        ? [{
            recipient_id: order.student_id,
            channel: "in_app" as const,
            title: "Paket süren doldu",
            body: `${packageName} paketinin süresi sona erdi. Yeni paketleri inceleyebilirsin.`,
            link: "/student/packages",
          }]
        : []),
      ...(admins || []).map((admin) => ({
        recipient_id: admin.id,
        channel: "in_app" as const,
        title: "Öğrenci paketi sona erdi",
        body: `${order.profiles?.full_name || "Bir öğrencinin"} - ${packageName}`,
        link: "/admin/orders",
      })),
    ];

    const { error: notificationError } = await supabase.from("notifications").insert(notifications);
    if (notificationError) {
      console.error("Paket bitiş bildirimi kaydedilemedi:", notificationError);
      continue;
    }

    if (resend && order.profiles?.email && order.profiles.email_notifications !== false) {
      try {
        await resend.emails.send({
          from: process.env.EMAIL_FROM || "bildirim@matematikozelders.com",
          to: order.profiles.email,
          subject: "Ders paketinin süresi sona erdi",
          html: `<p>Merhaba ${order.profiles.full_name},</p><p><strong>${packageName}</strong> paketinin süresi sona erdi. <a href="${process.env.NEXT_PUBLIC_SITE_URL || "https://matematikozelders.com"}/pricing">Yeni paketleri incele</a>.</p>`,
        });
      } catch (e) {
        console.error("Öğrenci paket bitiş e-postası gönderilemedi:", e);
      }
    }

    if (resend) {
      for (const admin of admins || []) {
        if (!admin.email || admin.email_notifications === false) continue;
        try {
          await resend.emails.send({
            from: process.env.EMAIL_FROM || "bildirim@matematikozelders.com",
            to: admin.email,
            subject: "Öğrenci paketinin süresi sona erdi",
            html: `<p>${order.profiles?.full_name || "Bir öğrencinin"} için <strong>${packageName}</strong> paket süresi sona erdi.</p>`,
          });
        } catch (e) {
          console.error("Admin paket bitiş e-postası gönderilemedi:", e);
        }
      }
    }

    await supabase.from("orders").update({ expiration_notified: true }).eq("id", order.id);
    results.expiredPackagesReminded++;
  }

  return NextResponse.json({ success: true, ...results });
}

interface ReminderRecipient {
  id: string;
  full_name: string;
  email: string;
  email_notifications: boolean;
}

interface ExpiringPackageOrder {
  id: string;
  student_id: string;
  product_name: string | null;
  package_expires_at: string;
}

interface ExpiredPackageOrder {
  id: string;
  student_id: string | null;
  product_name: string | null;
  package_expires_at: string;
  profiles: { full_name: string; email: string; email_notifications: boolean } | null;
}

async function sendReminder(
  lesson: LessonWithProfileRow,
  label: string,
  resend: Resend | null,
  supabase: ReturnType<typeof createAdminClient>
) {
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
