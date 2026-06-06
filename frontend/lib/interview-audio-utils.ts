export type AudioInputDevice = {
  deviceId: string;
  label: string;
};

export type MediaAccessMode = "av" | "audio-only" | "none";

export function parseMediaError(error: unknown): string {
  const err = error as DOMException & { name?: string; message?: string };
  const name = err?.name || "";

  if (name === "NotAllowedError" || name === "PermissionDeniedError") {
    return "Microphone access was denied. Allow microphone permission in your browser settings, then retry.";
  }
  if (name === "NotFoundError" || name === "DevicesNotFoundError") {
    return "No microphone was found. Connect a microphone or choose another input device.";
  }
  if (name === "NotReadableError" || name === "TrackStartError") {
    return "Microphone is in use by another application. Close other apps using the mic and retry.";
  }
  if (name === "OverconstrainedError") {
    return "Selected microphone is unavailable. Choose a different input device.";
  }
  if (name === "SecurityError") {
    return "Microphone access requires a secure connection (HTTPS or localhost).";
  }

  return err?.message || "Unable to access microphone.";
}

export async function listAudioInputDevices(): Promise<AudioInputDevice[]> {
  if (!navigator.mediaDevices?.enumerateDevices) return [];

  const devices = await navigator.mediaDevices.enumerateDevices();
  return devices
    .filter((device) => device.kind === "audioinput" && device.deviceId)
    .map((device, index) => ({
      deviceId: device.deviceId,
      label: device.label || `Microphone ${index + 1}`
    }));
}

export async function acquireInterviewMedia(preferredAudioDeviceId?: string) {
  const audio: boolean | MediaTrackConstraints = preferredAudioDeviceId
    ? { deviceId: { exact: preferredAudioDeviceId } }
    : true;

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio });
    return { stream, mode: "av" as MediaAccessMode, warning: null as string | null };
  } catch (videoError) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: false, audio });
      return {
        stream,
        mode: "audio-only" as MediaAccessMode,
        warning: `${parseMediaError(videoError)} Voice-only mode is active.`
      };
    } catch (audioError) {
      return {
        stream: null,
        mode: "none" as MediaAccessMode,
        warning: parseMediaError(audioError)
      };
    }
  }
}

export function stopMediaStream(stream: MediaStream | null) {
  stream?.getTracks().forEach((track) => track.stop());
}
