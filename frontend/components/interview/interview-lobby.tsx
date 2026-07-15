"use client";

import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Camera, CameraOff, Mic, MicOff, Wifi, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AudioInputDevice, MediaAccessMode } from "@/lib/interview-audio-utils";
import { checkBrowserCompatibility, checkNetworkQuality, type NetworkCheckResult } from "@/lib/interview-preflight";

type InterviewLobbyProps = {
  title: string;
  subtitle: string;
  localVideoRef: React.RefObject<HTMLVideoElement | null>;
  muted: boolean;
  cameraOff: boolean;
  mediaError: string | null;
  mediaMode: MediaAccessMode;
  micReady: boolean;
  audioInputDevices: AudioInputDevice[];
  videoInputDevices: AudioInputDevice[];
  selectedAudioDeviceId: string;
  selectedVideoDeviceId: string;
  onToggleMute: () => void;
  onToggleCamera: () => void;
  onSelectAudioDevice: (deviceId: string) => void;
  onSelectVideoDevice: (deviceId: string) => void;
  onRetryMedia: () => void;
  onJoin: () => void;
};

function useMicLevel(videoRef: React.RefObject<HTMLVideoElement | null>) {
  const [level, setLevel] = useState(0);

  useEffect(() => {
    let audioCtx: AudioContext | null = null;
    let analyser: AnalyserNode | null = null;
    let source: MediaStreamAudioSourceNode | null = null;
    let currentStream: MediaStream | null = null;
    let rafId = 0;
    let cancelled = false;

    function tick() {
      if (cancelled) return;
      const stream = (videoRef.current?.srcObject as MediaStream | null) || null;
      if (stream !== currentStream) {
        source?.disconnect();
        source = null;
        currentStream = stream;
        if (stream && stream.getAudioTracks().length > 0) {
          try {
            audioCtx = audioCtx || new AudioContext();
            analyser = audioCtx.createAnalyser();
            analyser.fftSize = 256;
            source = audioCtx.createMediaStreamSource(stream);
            source.connect(analyser);
          } catch {
            analyser = null;
          }
        } else {
          analyser = null;
        }
      }

      if (analyser) {
        const data = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(data);
        const avg = data.reduce((sum, value) => sum + value, 0) / data.length;
        setLevel(Math.min(1, avg / 110));
      } else {
        setLevel(0);
      }

      rafId = requestAnimationFrame(tick);
    }

    rafId = requestAnimationFrame(tick);
    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
      source?.disconnect();
      void audioCtx?.close().catch(() => undefined);
    };
  }, [videoRef]);

  return level;
}

export function InterviewLobby({
  title,
  subtitle,
  localVideoRef,
  muted,
  cameraOff,
  mediaError,
  mediaMode,
  micReady,
  audioInputDevices,
  videoInputDevices,
  selectedAudioDeviceId,
  selectedVideoDeviceId,
  onToggleMute,
  onToggleCamera,
  onSelectAudioDevice,
  onSelectVideoDevice,
  onRetryMedia,
  onJoin
}: InterviewLobbyProps) {
  const micLevel = useMicLevel(localVideoRef);
  const bars = useRef(Array.from({ length: 10 }, (_, index) => index)).current;
  const compatibility = useRef(checkBrowserCompatibility()).current;
  const [network, setNetwork] = useState<NetworkCheckResult | null>(null);

  useEffect(() => {
    let cancelled = false;
    void checkNetworkQuality().then((result) => {
      if (!cancelled) setNetwork(result);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-8 text-slate-100">
      <div className="w-full max-w-3xl rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Device check</p>
        <h1 className="mt-1 text-xl font-semibold text-white">{title}</h1>
        <p className="mt-1 text-sm text-slate-400">{subtitle}</p>

        {compatibility.blocking.length > 0 ? (
          <div className="mt-4 flex items-start gap-2 rounded-xl border border-rose-900/50 bg-rose-950/20 px-3 py-2 text-xs text-rose-200">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              Your browser does not support: {compatibility.blocking.map((c) => c.label).join(", ")}. Video calling may not
              work. Try Chrome, Edge, or Firefox.
            </p>
          </div>
        ) : null}
        {compatibility.warnings.length > 0 ? (
          <div className="mt-2 flex items-start gap-2 rounded-xl border border-amber-900/50 bg-amber-950/20 px-3 py-2 text-xs text-amber-200">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>Not supported in this browser: {compatibility.warnings.map((c) => c.label).join(", ")}.</p>
          </div>
        ) : null}
        {network && network.status !== "good" && network.status !== "unknown" ? (
          <div
            className={`mt-2 flex items-start gap-2 rounded-xl border px-3 py-2 text-xs ${
              network.status === "offline"
                ? "border-rose-900/50 bg-rose-950/20 text-rose-200"
                : "border-amber-900/50 bg-amber-950/20 text-amber-200"
            }`}
          >
            {network.status === "offline" ? (
              <WifiOff className="mt-0.5 h-4 w-4 shrink-0" />
            ) : (
              <Wifi className="mt-0.5 h-4 w-4 shrink-0" />
            )}
            <p>{network.message} You can continue anyway.</p>
          </div>
        ) : null}

        <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_260px]">
          <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-950">
            <video ref={localVideoRef} autoPlay playsInline muted className="aspect-video w-full object-cover" />
            {cameraOff || mediaMode === "audio-only" ? (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-950/85">
                <p className="text-sm text-slate-300">{mediaMode === "audio-only" ? "Voice-only mode" : "Camera off"}</p>
              </div>
            ) : null}
            <div className="absolute bottom-3 left-3 flex gap-2">
              <button
                type="button"
                onClick={onToggleMute}
                disabled={!micReady}
                className={`flex h-10 w-10 items-center justify-center rounded-full disabled:cursor-not-allowed disabled:opacity-50 ${
                  muted ? "bg-rose-600 text-white" : "bg-slate-800/90 text-slate-100"
                }`}
              >
                {muted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </button>
              <button
                type="button"
                onClick={onToggleCamera}
                className={`flex h-10 w-10 items-center justify-center rounded-full ${
                  cameraOff ? "bg-rose-600 text-white" : "bg-slate-800/90 text-slate-100"
                }`}
              >
                {cameraOff ? <CameraOff className="h-4 w-4" /> : <Camera className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div>
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Microphone level</p>
              <div className="flex h-6 items-end gap-1">
                {bars.map((index) => {
                  const active = micLevel * bars.length > index;
                  return (
                    <span
                      key={index}
                      className={`w-full rounded-sm transition-colors ${active ? "bg-emerald-500" : "bg-slate-800"}`}
                      style={{ height: `${20 + index * 6}%` }}
                    />
                  );
                })}
              </div>
            </div>

            {audioInputDevices.length > 0 ? (
              <label className="flex flex-col gap-1 text-xs">
                <span className="font-semibold uppercase tracking-[0.1em] text-slate-500">Microphone</span>
                <select
                  className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200"
                  value={selectedAudioDeviceId}
                  onChange={(event) => onSelectAudioDevice(event.target.value)}
                  disabled={!micReady}
                >
                  {audioInputDevices.map((device) => (
                    <option key={device.deviceId} value={device.deviceId}>
                      {device.label}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}

            {videoInputDevices.length > 0 ? (
              <label className="flex flex-col gap-1 text-xs">
                <span className="font-semibold uppercase tracking-[0.1em] text-slate-500">Camera</span>
                <select
                  className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200"
                  value={selectedVideoDeviceId}
                  onChange={(event) => onSelectVideoDevice(event.target.value)}
                  disabled={cameraOff && mediaMode === "audio-only"}
                >
                  {videoInputDevices.map((device) => (
                    <option key={device.deviceId} value={device.deviceId}>
                      {device.label}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}

            {mediaError ? (
              <div className="rounded-xl border border-amber-900/50 bg-amber-950/20 px-3 py-2 text-xs text-amber-200">
                <p>{mediaError}</p>
                <Button type="button" size="sm" variant="secondary" className="mt-2" onClick={onRetryMedia}>
                  Retry
                </Button>
              </div>
            ) : null}

            <Button type="button" className="mt-auto" onClick={onJoin}>
              Join interview
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
