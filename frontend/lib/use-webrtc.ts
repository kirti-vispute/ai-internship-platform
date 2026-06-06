"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { WebRtcSignal } from "@/lib/use-interview-socket";
import {
  acquireInterviewMedia,
  listAudioInputDevices,
  parseMediaError,
  stopMediaStream,
  type AudioInputDevice,
  type MediaAccessMode
} from "@/lib/interview-audio-utils";

const ICE_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" }
];

type UseWebRtcOptions = {
  enabled: boolean;
  isInitiator: boolean;
  onSignal: (signal: WebRtcSignal) => void;
};

export function useWebRtc({ enabled, isInitiator, onSignal }: UseWebRtcOptions) {
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const onSignalRef = useRef(onSignal);
  const isInitiatorRef = useRef(isInitiator);
  const makingOfferRef = useRef(false);
  const iceCandidateQueueRef = useRef<RTCIceCandidateInit[]>([]);
  const bootstrapCompleteRef = useRef(false);
  const selectedAudioDeviceIdRef = useRef("");
  const mutedRef = useRef(false);

  useEffect(() => {
    onSignalRef.current = onSignal;
  }, [onSignal]);

  useEffect(() => {
    isInitiatorRef.current = isInitiator;
  }, [isInitiator]);

  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [mediaMode, setMediaMode] = useState<MediaAccessMode>("none");
  const [micReady, setMicReady] = useState(false);
  const [audioInputDevices, setAudioInputDevices] = useState<AudioInputDevice[]>([]);
  const [selectedAudioDeviceId, setSelectedAudioDeviceId] = useState("");
  const [connected, setConnected] = useState(false);
  const [connectionState, setConnectionState] = useState<RTCPeerConnectionState>("new");

  useEffect(() => {
    mutedRef.current = muted;
  }, [muted]);

  const attachLocalStream = useCallback((stream: MediaStream) => {
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = stream;
    }
  }, []);

  const attachRemoteStream = useCallback((stream: MediaStream) => {
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = stream;
      remoteVideoRef.current.muted = true;
    }
    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = stream;
      void remoteAudioRef.current.play().catch(() => undefined);
    }
  }, []);

  const clearMediaElements = useCallback(() => {
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = null;
      remoteAudioRef.current.pause();
    }
  }, []);

  const closePeerConnection = useCallback(() => {
    pcRef.current?.close();
    pcRef.current = null;
    iceCandidateQueueRef.current = [];
  }, []);

  const flushIceCandidates = useCallback(async (pc: RTCPeerConnection) => {
    if (!pc.remoteDescription) return;
    const queued = [...iceCandidateQueueRef.current];
    iceCandidateQueueRef.current = [];
    for (const candidate of queued) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch {
        // Ignore stale ICE candidates.
      }
    }
  }, []);

  const refreshAudioDevices = useCallback(async () => {
    const devices = await listAudioInputDevices();
    setAudioInputDevices(devices);
    if (!selectedAudioDeviceIdRef.current && devices[0]?.deviceId) {
      selectedAudioDeviceIdRef.current = devices[0].deviceId;
      setSelectedAudioDeviceId(devices[0].deviceId);
    }
  }, []);

  const replaceAudioTrack = useCallback(async (newAudioTrack: MediaStreamTrack) => {
    const pc = pcRef.current;
    const sender = pc?.getSenders().find((item) => item.track?.kind === "audio");
    if (sender) {
      await sender.replaceTrack(newAudioTrack);
      return;
    }
    if (pc && localStreamRef.current) {
      pc.addTrack(newAudioTrack, localStreamRef.current);
    }
  }, []);

  const createPeerConnection = useCallback(() => {
    if (pcRef.current && pcRef.current.connectionState !== "closed") {
      return pcRef.current;
    }

    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        onSignalRef.current({ type: "ice-candidate", candidate: event.candidate.toJSON() });
      }
    };
    pc.ontrack = (event) => {
      const [stream] = event.streams;
      if (!stream) return;
      remoteStreamRef.current = stream;
      attachRemoteStream(stream);
      setConnected(true);
    };
    pc.onconnectionstatechange = () => {
      setConnectionState(pc.connectionState);
      if (pc.connectionState === "connected") {
        setConnected(true);
      }
      if (pc.connectionState === "failed") {
        setConnected(false);
        if (isInitiatorRef.current && bootstrapCompleteRef.current) {
          void (async () => {
            try {
              makingOfferRef.current = true;
              await pc.setLocalDescription(await pc.createOffer({ iceRestart: true }));
              onSignalRef.current({ type: "offer", sdp: pc.localDescription || undefined });
            } catch {
              // Recovery attempt failed; user can refresh.
            } finally {
              makingOfferRef.current = false;
            }
          })();
        }
      }
      if (pc.connectionState === "disconnected") {
        setConnected(false);
      }
    };

    const localStream = localStreamRef.current;
    if (localStream) {
      localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));
    }

    pcRef.current = pc;
    return pc;
  }, [attachRemoteStream]);

  const startLocalMedia = useCallback(
    async (preferredAudioDeviceId?: string) => {
      stopMediaStream(localStreamRef.current);
      localStreamRef.current = null;

      const result = await acquireInterviewMedia(preferredAudioDeviceId || selectedAudioDeviceIdRef.current || undefined);
      setMediaMode(result.mode);

      if (!result.stream) {
        setMediaError(result.warning);
        setMicReady(false);
        setCameraOff(true);
        return null;
      }

      localStreamRef.current = result.stream;
      attachLocalStream(result.stream);
      setMicReady(result.stream.getAudioTracks().length > 0);
      setMediaError(result.warning);
      setCameraOff(result.mode === "audio-only" || result.stream.getVideoTracks().length === 0);

      const audioTrack = result.stream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !mutedRef.current;
        if (audioTrack.getSettings().deviceId) {
          selectedAudioDeviceIdRef.current = audioTrack.getSettings().deviceId || "";
          setSelectedAudioDeviceId(selectedAudioDeviceIdRef.current);
        }
      }

      await refreshAudioDevices();
      return result.stream;
    },
    [attachLocalStream, refreshAudioDevices]
  );

  const createOffer = useCallback(async () => {
    const pc = createPeerConnection();
    makingOfferRef.current = true;
    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      onSignalRef.current({ type: "offer", sdp: offer });
    } finally {
      makingOfferRef.current = false;
    }
  }, [createPeerConnection]);

  const handleRemoteSignal = useCallback(
    async ({ signal }: { fromUserId: string; signal: WebRtcSignal }) => {
      const pc = createPeerConnection();

      if (signal.type === "offer" && signal.sdp) {
        if (makingOfferRef.current) return;
        await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
        await flushIceCandidates(pc);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        onSignalRef.current({ type: "answer", sdp: answer });
        return;
      }

      if (signal.type === "answer" && signal.sdp) {
        await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
        await flushIceCandidates(pc);
        return;
      }

      if (signal.type === "ice-candidate" && signal.candidate) {
        if (!pc.remoteDescription) {
          iceCandidateQueueRef.current.push(signal.candidate);
          return;
        }
        try {
          await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
        } catch {
          // Ignore stale ICE candidates.
        }
      }
    },
    [createPeerConnection, flushIceCandidates]
  );

  useEffect(() => {
    if (!enabled) {
      bootstrapCompleteRef.current = false;
      return undefined;
    }

    let cancelled = false;

    async function bootstrap() {
      bootstrapCompleteRef.current = false;
      await startLocalMedia();
      if (cancelled) return;
      createPeerConnection();
      if (isInitiatorRef.current) {
        await createOffer();
      }
      bootstrapCompleteRef.current = true;
    }

    void bootstrap();

    return () => {
      cancelled = true;
      bootstrapCompleteRef.current = false;
      closePeerConnection();
      stopMediaStream(localStreamRef.current);
      localStreamRef.current = null;
      remoteStreamRef.current = null;
      clearMediaElements();
      setConnected(false);
      setConnectionState("closed");
      setMicReady(false);
      setMediaMode("none");
    };
  }, [
    enabled,
    isInitiator,
    startLocalMedia,
    createPeerConnection,
    createOffer,
    closePeerConnection,
    clearMediaElements
  ]);

  useEffect(() => {
    if (!enabled || !navigator.mediaDevices?.addEventListener) return undefined;
    const handleDeviceChange = () => {
      void refreshAudioDevices();
    };
    navigator.mediaDevices.addEventListener("devicechange", handleDeviceChange);
    return () => navigator.mediaDevices.removeEventListener("devicechange", handleDeviceChange);
  }, [enabled, refreshAudioDevices]);

  function toggleMute() {
    const stream = localStreamRef.current;
    if (!stream || stream.getAudioTracks().length === 0) return muted;
    const next = !muted;
    stream.getAudioTracks().forEach((track) => {
      track.enabled = !next;
    });
    setMuted(next);
    return next;
  }

  function toggleCamera() {
    const stream = localStreamRef.current;
    if (!stream || stream.getVideoTracks().length === 0) {
      setCameraOff(true);
      return true;
    }
    const next = !cameraOff;
    stream.getVideoTracks().forEach((track) => {
      track.enabled = !next;
    });
    setCameraOff(next);
    return next;
  }

  const retryMediaAccess = useCallback(async () => {
    const stream = await startLocalMedia(selectedAudioDeviceIdRef.current || undefined);
    if (!stream) return false;
    const pc = createPeerConnection();
    if (isInitiatorRef.current) {
      await createOffer();
    } else if (pc.remoteDescription) {
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      onSignalRef.current({ type: "answer", sdp: answer });
    }
    bootstrapCompleteRef.current = true;
    return true;
  }, [createOffer, createPeerConnection, startLocalMedia]);

  const switchAudioInput = useCallback(
    async (deviceId: string) => {
      if (!deviceId) return false;
      selectedAudioDeviceIdRef.current = deviceId;
      setSelectedAudioDeviceId(deviceId);

      const wantVideo = mediaMode === "av" && !cameraOff;
      try {
        const nextStream = await navigator.mediaDevices.getUserMedia({
          audio: { deviceId: { exact: deviceId } },
          video: wantVideo
        });

        const previous = localStreamRef.current;
        const nextAudioTrack = nextStream.getAudioTracks()[0];
        if (!nextAudioTrack) {
          stopMediaStream(nextStream);
          setMediaError("Selected microphone did not produce an audio track.");
          return false;
        }

        nextAudioTrack.enabled = !mutedRef.current;
        await replaceAudioTrack(nextAudioTrack);

        previous?.getAudioTracks().forEach((track) => track.stop());

        const merged = new MediaStream();
        merged.addTrack(nextAudioTrack);
        if (wantVideo && nextStream.getVideoTracks()[0]) {
          previous?.getVideoTracks().forEach((track) => track.stop());
          merged.addTrack(nextStream.getVideoTracks()[0]);
        } else if (previous?.getVideoTracks()[0]) {
          merged.addTrack(previous.getVideoTracks()[0]);
        }

        localStreamRef.current = merged;
        attachLocalStream(merged);
        nextStream.getTracks().forEach((track) => {
          if (!merged.getTracks().includes(track)) track.stop();
        });
        setMicReady(true);
        setMediaError(null);
        await refreshAudioDevices();
        return true;
      } catch (error) {
        setMediaError(parseMediaError(error));
        return false;
      }
    },
    [attachLocalStream, cameraOff, mediaMode, refreshAudioDevices, replaceAudioTrack]
  );

  const renegotiate = useCallback(async () => {
    if (!isInitiatorRef.current || !bootstrapCompleteRef.current) return;
    await createOffer();
  }, [createOffer]);

  return {
    localVideoRef,
    remoteVideoRef,
    remoteAudioRef,
    muted,
    cameraOff,
    mediaError,
    mediaMode,
    micReady,
    audioInputDevices,
    selectedAudioDeviceId,
    connected,
    connectionState,
    toggleMute,
    toggleCamera,
    handleRemoteSignal,
    retryMediaAccess,
    switchAudioInput,
    renegotiate
  };
}
