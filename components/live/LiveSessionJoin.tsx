"use client";

import { useEffect, useRef, useState } from "react";
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
import { Loader2, Maximize2, Minimize2, MonitorUp, Video } from "lucide-react";
import { LiveSessionChat } from "@/components/live/LiveSessionChat";

function SessionLayout() {
  const tracks = useTracks([
    { source: Track.Source.Camera, withPlaceholder: true },
    { source: Track.Source.ScreenShare, withPlaceholder: false },
  ]);

  return (
    <div className="h-full min-h-[320px] overflow-hidden rounded-2xl border border-slate-200 bg-slate-950">
      <GridLayout tracks={tracks} style={{ height: "100%" }}>
        <ParticipantTile />
      </GridLayout>
      <RoomAudioRenderer />
    </div>
  );
}

function LiveSessionRoomControls({
  isHost,
  isFullscreen,
  onToggleFullscreen,
  onError,
}: {
  isHost: boolean;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  onError: (message: string | null) => void;
}) {
  const {
    localParticipant,
    isMicrophoneEnabled,
    isCameraEnabled,
    isScreenShareEnabled,
  } = useLocalParticipant();
  const remoteParticipants = useRemoteParticipants();
  const room = useRoomContext();

  const handleToggleMicrophone = async () => {
    onError(null);
    try {
      await localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled);
    } catch (err) {
      onError(err instanceof Error ? err.message : "Mikrofon açılamadı. Tarayıcı izinlerini kontrol edin.");
    }
  };

  const handleToggleCamera = async () => {
    onError(null);
    try {
      await localParticipant.setCameraEnabled(!isCameraEnabled);
    } catch (err) {
      onError(err instanceof Error ? err.message : "Kamera açılamadı. Tarayıcı izinlerini kontrol edin.");
    }
  };

  const handleToggleScreenShare = async () => {
    onError(null);
    try {
      await localParticipant.setScreenShareEnabled(!isScreenShareEnabled);
    } catch (err) {
      onError(err instanceof Error ? err.message : "Ekran paylaşımı başlatılamadı.");
    }
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
            onClick={handleToggleScreenShare}
            className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium ${
              isScreenShareEnabled
                ? "border-brand-300 bg-brand-50 text-brand-700 hover:bg-brand-100"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            <MonitorUp className="h-3.5 w-3.5" />
            {isScreenShareEnabled ? "Ekran paylaşımını durdur" : "Ekran paylaş"}
          </button>

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

      <button
        type="button"
        onClick={onToggleFullscreen}
        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
      >
        {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
        {isFullscreen ? "Tam ekrandan çık" : "Tam ekran"}
      </button>
    </div>
  );
}

export function LiveSessionJoin({ sessionId }: { sessionId: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [token, setToken] = useState<string | null>(null);
  const [serverUrl, setServerUrl] = useState<string | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [roomError, setRoomError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === containerRef.current);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const toggleFullscreen = async () => {
    const container = containerRef.current;
    if (!container) return;

    setRoomError(null);
    try {
      if (document.fullscreenElement === container) {
        await document.exitFullscreen();
      } else {
        if (document.fullscreenElement) await document.exitFullscreen();
        await container.requestFullscreen();
      }
    } catch (err) {
      setRoomError(err instanceof Error ? err.message : "Tam ekran açılamadı.");
    }
  };

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
    <div
      ref={containerRef}
      className={`mt-4 ${
        isFullscreen
          ? "fixed inset-0 z-[100] m-0 h-screen w-screen overflow-hidden bg-slate-100 p-3 sm:p-5"
          : "h-[min(75vh,760px)] min-h-[560px] rounded-2xl border border-slate-200 bg-slate-100 p-3 sm:p-4"
      }`}
    >
      <LiveKitRoom
        video={false}
        audio={false}
        token={token}
        serverUrl={serverUrl}
        connect={true}
        options={{ adaptiveStream: true, dynacast: true }}
      >
        <div className="flex h-full min-h-0 flex-col gap-3">
          <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
              <Video className="h-4 w-4 text-brand-600" />
              Canlı ders odası
            </div>
            <LiveSessionRoomControls
              isHost={isHost}
              isFullscreen={isFullscreen}
              onToggleFullscreen={toggleFullscreen}
              onError={setRoomError}
            />
          </header>

          {roomError && (
            <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {roomError}
            </p>
          )}

          <main className="grid min-h-0 flex-1 grid-cols-1 gap-3 overflow-y-auto lg:grid-cols-[minmax(0,1fr)_20rem] lg:overflow-hidden">
            <section className="min-h-[320px] lg:min-h-0">
              <SessionLayout />
            </section>
            <aside className="min-h-[280px] lg:min-h-0">
              <LiveSessionChat sessionId={sessionId} />
            </aside>
          </main>
        </div>
      </LiveKitRoom>
    </div>
  );
}
