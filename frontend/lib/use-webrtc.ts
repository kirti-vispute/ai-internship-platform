"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { WebRtcSignal } from "@/lib/use-interview-socket";

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
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const makingOfferRef = useRef(false);
  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);

  const attachLocalStream = useCallback((stream: MediaStream) => {
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = stream;
    }
  }, []);

  const attachRemoteStream = useCallback((stream: MediaStream) => {
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = stream;
    }
  }, []);

  const createPeerConnection = useCallback(() => {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        onSignal({ type: "ice-candidate", candidate: event.candidate.toJSON() });
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
      if (pc.connectionState === "connected") {
        setConnected(true);
      }
      if (pc.connectionState === "failed" || pc.connectionState === "disconnected") {
        setConnected(false);
      }
    };

    const localStream = localStreamRef.current;
    if (localStream) {
      localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));
    }

    pcRef.current = pc;
    return pc;
  }, [attachRemoteStream, onSignal]);

  const startLocalMedia = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStreamRef.current = stream;
      attachLocalStream(stream);
      setMediaError(null);
      return stream;
    } catch (error) {
      setMediaError((error as Error).message || "Camera/microphone access denied");
      return null;
    }
  }, [attachLocalStream]);

  const createOffer = useCallback(async () => {
    const pc = pcRef.current || createPeerConnection();
    makingOfferRef.current = true;
    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      onSignal({ type: "offer", sdp: offer });
    } finally {
      makingOfferRef.current = false;
    }
  }, [createPeerConnection, onSignal]);

  const handleRemoteSignal = useCallback(
    async ({ signal }: { fromUserId: string; signal: WebRtcSignal }) => {
      const pc = pcRef.current || createPeerConnection();

      if (signal.type === "offer" && signal.sdp) {
        await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        onSignal({ type: "answer", sdp: answer });
        return;
      }

      if (signal.type === "answer" && signal.sdp) {
        await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
        return;
      }

      if (signal.type === "ice-candidate" && signal.candidate) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
        } catch {
          // Ignore stale ICE candidates.
        }
      }
    },
    [createPeerConnection, onSignal]
  );

  useEffect(() => {
    if (!enabled) return undefined;

    let cancelled = false;

    async function bootstrap() {
      await startLocalMedia();
      if (cancelled) return;
      createPeerConnection();
      if (isInitiator) {
        await createOffer();
      }
    }

    bootstrap();

    return () => {
      cancelled = true;
      pcRef.current?.close();
      pcRef.current = null;
      localStreamRef.current?.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
      remoteStreamRef.current = null;
    };
  }, [enabled, isInitiator, startLocalMedia, createPeerConnection, createOffer]);

  function toggleMute() {
    const stream = localStreamRef.current;
    if (!stream) return muted;
    const next = !muted;
    stream.getAudioTracks().forEach((track) => {
      track.enabled = !next;
    });
    setMuted(next);
    return next;
  }

  function toggleCamera() {
    const stream = localStreamRef.current;
    if (!stream) return cameraOff;
    const next = !cameraOff;
    stream.getVideoTracks().forEach((track) => {
      track.enabled = !next;
    });
    setCameraOff(next);
    return next;
  }

  return {
    localVideoRef,
    remoteVideoRef,
    muted,
    cameraOff,
    mediaError,
    connected,
    toggleMute,
    toggleCamera,
    handleRemoteSignal
  };
}
