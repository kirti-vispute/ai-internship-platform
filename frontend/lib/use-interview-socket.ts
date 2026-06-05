"use client";

import { useEffect, useRef } from "react";
import { io, type Socket } from "socket.io-client";
import type { InterviewChatMessage, InterviewRoom } from "@/lib/interview-portal";
import { resolveInterviewSocketUrl } from "@/lib/interview-portal";
import { getAuthSession } from "@/lib/session";
import { FEATURE_FLAGS } from "@/constants/featureFlags";

export type WebRtcSignal = {
  type: "offer" | "answer" | "ice-candidate";
  sdp?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit;
};

type ParticipantUpdate = {
  roomId: string;
  userId?: string;
  role?: "intern" | "company";
  joined?: boolean;
  muted?: boolean;
  cameraOff?: boolean;
};

type InterviewSocketHandlers = {
  onJoined?: (payload: { room: InterviewRoom; participantRole: "intern" | "company"; isInitiator: boolean }) => void;
  onSignal?: (payload: { fromUserId: string; signal: WebRtcSignal }) => void;
  onChat?: (message: InterviewChatMessage) => void;
  onParticipantUpdate?: (payload: ParticipantUpdate) => void;
  onEnd?: (payload: { room: InterviewRoom }) => void;
};

export function useInterviewSocket(handlers: InterviewSocketHandlers) {
  const socketRef = useRef<Socket | null>(null);
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    if (!FEATURE_FLAGS.ENABLE_INTERVIEW_ROOMS) return undefined;

    const token = getAuthSession()?.token;
    if (!token) return undefined;

    const socket = io(resolveInterviewSocketUrl(), {
      auth: { token },
      transports: ["websocket", "polling"]
    });

    socketRef.current = socket;

    socket.on("interview:signal", (payload: { fromUserId: string; signal: WebRtcSignal }) => {
      handlersRef.current.onSignal?.(payload);
    });

    socket.on("interview:chat", (payload: { message: InterviewChatMessage }) => {
      if (payload?.message) handlersRef.current.onChat?.(payload.message);
    });

    socket.on("interview:participant:update", (payload: ParticipantUpdate) => {
      handlersRef.current.onParticipantUpdate?.(payload);
    });

    socket.on("interview:end", (payload: { room: InterviewRoom }) => {
      handlersRef.current.onEnd?.(payload);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  function joinRoom(roomId: string) {
    return new Promise<{
      ok: boolean;
      room?: InterviewRoom;
      participantRole?: "intern" | "company";
      isInitiator?: boolean;
      message?: string;
    }>((resolve) => {
      const emitJoin = () => {
        const socket = socketRef.current;
        if (!socket) {
          resolve({ ok: false, message: "Socket not ready" });
          return;
        }
        socket.emit("interview:join", { roomId }, (response?: {
          ok?: boolean;
          room?: InterviewRoom;
          participantRole?: "intern" | "company";
          isInitiator?: boolean;
          message?: string;
        }) => {
          if (response?.ok && response.room && response.participantRole) {
            handlersRef.current.onJoined?.({
              room: response.room,
              participantRole: response.participantRole,
              isInitiator: Boolean(response.isInitiator)
            });
            resolve({
              ok: true,
              room: response.room,
              participantRole: response.participantRole,
              isInitiator: response.isInitiator
            });
            return;
          }
          resolve({ ok: false, message: response?.message || "Failed to join room" });
        });
      };

      const socket = socketRef.current;
      if (!socket) {
        resolve({ ok: false, message: "Socket not ready" });
        return;
      }
      if (socket.connected) {
        emitJoin();
        return;
      }
      socket.once("connect", emitJoin);
      socket.once("connect_error", () => resolve({ ok: false, message: "Socket connection failed" }));
    });
  }

  function sendSignal(roomId: string, signal: WebRtcSignal) {
    const socket = socketRef.current;
    if (!socket?.connected) return;
    socket.emit("interview:signal", { roomId, signal });
  }

  function sendChat(roomId: string, body: string) {
    return new Promise<{ ok: boolean; message?: InterviewChatMessage; messageText?: string }>((resolve) => {
      const socket = socketRef.current;
      if (!socket?.connected) {
        resolve({ ok: false, messageText: "Socket not connected" });
        return;
      }
      socket.emit("interview:chat", { roomId, body }, (response?: { ok?: boolean; message?: InterviewChatMessage | string }) => {
        if (response?.ok && response.message && typeof response.message === "object") {
          resolve({ ok: true, message: response.message });
          return;
        }
        const errorText = typeof response?.message === "string" ? response.message : "Failed to send message";
        resolve({ ok: false, messageText: errorText });
      });
    });
  }

  function updateParticipantStatus(roomId: string, status: { muted?: boolean; cameraOff?: boolean }) {
    const socket = socketRef.current;
    if (!socket?.connected) return;
    socket.emit("interview:participant:update", { roomId, ...status });
  }

  function endRoom(roomId: string) {
    return new Promise<{ ok: boolean; room?: InterviewRoom; message?: string }>((resolve) => {
      const socket = socketRef.current;
      if (!socket?.connected) {
        resolve({ ok: false, message: "Socket not connected" });
        return;
      }
      socket.emit("interview:end", { roomId }, (response?: { ok?: boolean; room?: InterviewRoom; message?: string }) => {
        resolve({ ok: Boolean(response?.ok), room: response?.room, message: response?.message });
      });
    });
  }

  return {
    joinRoom,
    sendSignal,
    sendChat,
    updateParticipantStatus,
    endRoom
  };
}
