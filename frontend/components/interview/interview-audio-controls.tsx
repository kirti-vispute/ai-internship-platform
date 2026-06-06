"use client";

import { Mic, MicOff, RefreshCw } from "lucide-react";
import type { AudioInputDevice, MediaAccessMode } from "@/lib/interview-audio-utils";
import { Button } from "@/components/ui/button";

type InterviewAudioControlsProps = {
  muted: boolean;
  mediaError: string | null;
  mediaMode: MediaAccessMode;
  audioInputDevices: AudioInputDevice[];
  selectedAudioDeviceId: string;
  micReady: boolean;
  onRetryMedia: () => void;
  onSelectAudioDevice: (deviceId: string) => void;
};

export function InterviewAudioControls({
  muted,
  mediaError,
  mediaMode,
  audioInputDevices,
  selectedAudioDeviceId,
  micReady,
  onRetryMedia,
  onSelectAudioDevice
}: InterviewAudioControlsProps) {
  return (
    <div className="mx-auto mt-3 max-w-2xl space-y-2 px-4">
      <div className="flex flex-wrap items-center justify-center gap-2">
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium ${
            !micReady
              ? "bg-amber-950/50 text-amber-300"
              : muted
                ? "bg-rose-950/50 text-rose-300"
                : "bg-emerald-950/50 text-emerald-300"
          }`}
        >
          {!micReady ? <MicOff className="h-3 w-3" /> : muted ? <MicOff className="h-3 w-3" /> : <Mic className="h-3 w-3" />}
          {!micReady ? "Microphone unavailable" : muted ? "You are muted" : "Microphone live"}
        </span>
        {mediaMode === "audio-only" ? (
          <span className="rounded-full bg-sky-950/50 px-2.5 py-1 text-[11px] font-medium text-sky-300">Voice-only mode</span>
        ) : null}
      </div>

      {audioInputDevices.length > 0 ? (
        <label className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-center sm:gap-2">
          <span className="text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
            Microphone
          </span>
          <select
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-200"
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

      {mediaError ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-amber-900/50 bg-amber-950/20 px-3 py-2 text-center">
          <p className="text-xs text-amber-200">{mediaError}</p>
          <Button type="button" size="sm" variant="secondary" onClick={onRetryMedia}>
            <RefreshCw className="h-3.5 w-3.5" />
            Retry microphone
          </Button>
        </div>
      ) : null}
    </div>
  );
}
