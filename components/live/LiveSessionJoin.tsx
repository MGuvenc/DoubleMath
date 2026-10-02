"use client";

import { useEffect, useState } from "react";
import { LiveKitRoom, GridLayout, ParticipantTile, RoomAudioRenderer, useTracks } from "@livekit/components-react";
import "@livekit/components-styles";
import { Track } from "livekit-client";
import { Loader2, MonitorUp, Video } from "lucide-react";
import { LiveSessionChat } from "@/components/live/LiveSessionChat";

function SessionLayout() {
  const tracks = useTracks([
    { source: Track.Source.Camera, withPlaceholder: true },
    { source: Track.Source.ScreenShare, withPlaceholder: false },
  ]);

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-950">
      <GridLayout tracks={tracks} style={{ height: "420px" }}>
        <ParticipantTile />
      </GridLayout>
      <RoomAudioRenderer />
    </div>
  );
}

export function LiveSessionJoin({ sessionId, roomName }: { sessionId: string; roomName: string }) {
  const [token, setToken] = useState<string | null>(null);
  const [serverUrl, setServerUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function fetchToken() {
      try {
        setLoading(true);
        const response = await fetch("/api/live/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        });

        const payload = await response.json();
        if (!response.ok || !payload?.token || !payload?.serverUrl) {
          throw new Error(payload?.error || "Canlı derse katılma isteği reddedildi.");
        }

        if (!active) return;
        setToken(payload.token);
        setServerUrl(payload.serverUrl);
        setError(null);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Canlı derse katılınamadı.");
      } finally {
        if (active) setLoading(false);
      }
    }

    fetchToken();

    return () => {
      active = false;
    };
  }, [sessionId]);

  if (loading) {
    return (
      <div className="card mt-4 flex items-center gap-3 text-sm text-slate-600">
        <Loader2 className="h-4 w-4 animate-spin" />
        Canlı derse bağlanılıyor...
      </div>
    );
  }

  if (error) {
    return <div className="card mt-4 text-sm text-rose-700">{error}</div>;
  }

  if (!token || !serverUrl) {
    return null;
  }

  return (
    <div className="mt-4 space-y-4">
      <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
        <Video className="h-4 w-4 text-brand-600" />
        Canlı ders odası
      </div>

      <LiveKitRoom
        video={true}
        audio={true}
        token={token}
        serverUrl={serverUrl}
        roomName={roomName}
        connect={true}
        options={{ adaptiveStream: true, dynacast: true }}
      >
        <SessionLayout />
      </LiveKitRoom>

      <div className="flex items-center gap-2 text-xs text-slate-500">
        <MonitorUp className="h-3.5 w-3.5" />
        Mikrofon ve kamera erişimini açmanız gerekebilir.
      </div>

      <LiveSessionChat sessionId={sessionId} />
    </div>
  );
}
