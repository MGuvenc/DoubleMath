import { AccessToken } from "livekit-server-sdk";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Giriş yapmalısın." }, { status: 401 });

  let sessionId: string;
  try {
    ({ sessionId } = await request.json());
  } catch {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }
  if (typeof sessionId !== "string") {
    return NextResponse.json({ error: "Canlı ders bulunamadı." }, { status: 400 });
  }

  const [{ data: profile }, { data: session }] = await Promise.all([
    supabase.from("profiles").select("role, full_name, is_active").eq("id", user.id).single<{
      role: string;
      full_name: string;
      is_active: boolean;
    }>(),
    supabase.from("live_sessions").select("room_name, status").eq("id", sessionId).maybeSingle<{
      room_name: string;
      status: string;
    }>(),
  ]);

  if (!profile?.is_active || !session) {
    return NextResponse.json({ error: "Canlı derse erişim iznin yok." }, { status: 403 });
  }

  const isHost = profile.role === "admin";
  if (isHost ? !["scheduled", "live"].includes(session.status) : session.status !== "live") {
    return NextResponse.json({ error: "Bu canlı ders şu anda katılıma açık değil." }, { status: 403 });
  }

  const serverUrl = process.env.LIVEKIT_URL;
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  if (!serverUrl || !apiKey || !apiSecret) {
    return NextResponse.json({ error: "Canlı yayın servisi henüz yapılandırılmamış." }, { status: 503 });
  }

  const accessToken = new AccessToken(apiKey, apiSecret, {
    identity: user.id,
    name: profile.full_name || user.email || "Katılımcı",
    ttl: "2h",
  });
  accessToken.addGrant({
    roomJoin: true,
    room: session.room_name,
    canPublish: isHost,
    canSubscribe: true,
    canPublishData: true,
  });

  return NextResponse.json({ token: await accessToken.toJwt(), serverUrl, isHost });
}