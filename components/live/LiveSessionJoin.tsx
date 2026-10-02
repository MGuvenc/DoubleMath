"use client";

import { useEffect, useState } from "react";
import {
  LiveKitRoom,
  GridLayout,
  ParticipantTile,
  RoomAudioRenderer,
  useLocalParticipant,
  useRoomContext,
  useRemoteParticipants,
  useTracks,
} from "@livekit/components-react";
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

function LiveSessionRoomControls({ isHost }: { isHost: boolean }) {
  const { localParticipant, isMicrophoneEnabled, isCameraEnabled } = useLocalParticipant();
  const remoteParticipants = useRemoteParticipants();
  const room = useRoomContext();

  const handleToggleMicrophone = async () => {
    await localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled);
  };

  const handleToggleCamera = async () => {
    await localParticipant.setCameraEnabled(!isCameraEnabled);
  };

  const handleMuteStudents = () => {
    for (const participant of remoteParticipants) {
      participant.getTrackPublication(Track.Source.Microphone)?.setEnabled(false);
    }
  };

  const handleStopBroadcast = async () => {
    await localParticipant.setMicrophoneEnabled(false);
    await localParticipant.setCameraEnabled(false);
    room.disconnect();
  };

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={handleToggleMicrophone}
        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
      >
        {isMicrophoneEnabled ? "Mikrofonu kapat" : "Mikrofonu aç"}
      </button>

      <button
        type="button"
        onClick={handleToggleCamera}
        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
      >
        {isCameraEnabled ? "Kamerayı kapat" : "Kamerayı aç"}
      </button>

      {isHost && (
        <>
          <button
            type="button"
            onClick={handleMuteStudents}
            className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700 hover:bg-amber-100"
          >
            Öğrenciyi sustur
          </button>

          <button
            type="button"
            onClick={handleStopBroadcast}
            className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700 hover:bg-rose-100"
          >
            Yayını durdur
          </button>
        </>
      )}
    </div>
  );
}

export function LiveSessionJoin({ sessionId }: { sessionId: string }) {
  const [token, setToken] = useState<string | null>(null);
  const [serverUrl, setServerUrl] = useState<string | null>(null);
  const [isHost, setIsHost] = useState(false);
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
        setIsHost(Boolean(payload.isHost));
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
        video={false}
        audio={false}
        token={token}
        serverUrl={serverUrl}
        connect={true}
        options={{ adaptiveStream: true, dynacast: true }}
      >
        <LiveSessionRoomControls isHost={isHost} />
        <SessionLayout />
      </LiveKitRoom>

      <div className="flex items-center gap-2 text-xs text-slate-500">
        <MonitorUp className="h-3.5 w-3.5" />
        Mikrofon ve kamera erişimini açmak için butonları kullanın. Varsayılan olarak kapalı başlar.
      </div>

      <LiveSessionChat sessionId={sessionId} />
    </div>
  );
}
