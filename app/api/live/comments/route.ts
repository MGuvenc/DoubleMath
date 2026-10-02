import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

async function getSessionAccess(supabase: ReturnType<typeof createClient>, userId: string, sessionId: string) {
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, is_active")
    .eq("id", userId)
    .single<{ role: string; is_active: boolean }>();

  if (!profile?.is_active) return { ok: false, status: 403, error: "Canlı derse erişim iznin yok." };

  const { data: session } = await supabase
    .from("live_sessions")
    .select("id, status, target_mode, room_name")
    .eq("id", sessionId)
    .maybeSingle<{ id: string; status: string; target_mode: "all" | "specific"; room_name: string }>();

  if (!session) return { ok: false, status: 404, error: "Canlı ders bulunamadı." };

  const isHost = profile.role === "admin";
  if (isHost ? !["scheduled", "live"].includes(session.status) : session.status !== "live") {
    return { ok: false, status: 403, error: "Bu canlı ders şu anda katılıma açık değil." };
  }

  if (!isHost && session.target_mode === "specific") {
    const { data: targetMatch } = await supabase
      .from("live_session_targets")
      .select("session_id")
      .eq("session_id", sessionId)
      .eq("student_id", userId)
      .maybeSingle();

    if (!targetMatch) {
      return { ok: false, status: 403, error: "Bu canlı derse katılma izniniz yok." };
    }
  }

  return { ok: true, session };
}

export async function GET(request: Request) {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user;

  if (!user) return NextResponse.json({ error: "Giriş yapmalısın." }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("sessionId");

  if (!sessionId) return NextResponse.json({ error: "Canlı ders bulunamadı." }, { status: 400 });

  const access = await getSessionAccess(supabase, user.id, sessionId);
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const { data: comments } = await supabase
    .from("live_session_comments")
    .select("id, body, created_at, sender_id, profiles!live_session_comments_sender_id_fkey(full_name)")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });

  return NextResponse.json({ comments: comments || [] });
}

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user;

  if (!user) return NextResponse.json({ error: "Giriş yapmalısın." }, { status: 401 });

  let body: { sessionId?: string; body?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  const sessionId = body.sessionId;
  const message = (body.body || "").trim();

  if (!sessionId || typeof sessionId !== "string") {
    return NextResponse.json({ error: "Canlı ders bulunamadı." }, { status: 400 });
  }
  if (!message || message.length > 1000) {
    return NextResponse.json({ error: "Mesaj 1 ile 1000 karakter arasında olmalıdır." }, { status: 400 });
  }

  const access = await getSessionAccess(supabase, user.id, sessionId);
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const { data: comment, error } = await supabase
    .from("live_session_comments")
    .insert({
      session_id: sessionId,
      sender_id: user.id,
      body: message,
    })
    .select("id, body, created_at, sender_id, profiles!live_session_comments_sender_id_fkey(full_name)")
    .single();

  if (error || !comment) {
    return NextResponse.json({ error: "Mesaj gönderilemedi." }, { status: 500 });
  }

  return NextResponse.json({ comment });
}
