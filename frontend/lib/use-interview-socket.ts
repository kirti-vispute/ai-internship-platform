"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import type { InterviewChatMessage, InterviewRoom } from "@/lib/interview-portal";
import {
  endInterviewSocketRoom,
  joinInterviewSocketRoom,
  leaveInterviewSocketRoom,
  sendInterviewChat,
  sendInterviewSignal,
  subscribeInterviewSocket,
  updateInterviewParticipantStatus,
  type InterviewSocketHandlers,
  type ParticipantUpdate
} from "@/lib/interview-socket-manager";

export type WebRtcSignal = {
  type: "offer" | "answer" | "ice-candidate";
  sdp?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit;
};

export type { ParticipantUpdate };

type InterviewSocketHookHandlers = InterviewSocketHandlers;

export function useInterviewSocket(handlers: InterviewSocketHookHandlers) {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;
  const activeRoomRef = useRef<string | null>(null);

  useEffect(() => {
    return subscribeInterviewSocket({
      onJoined: (payload) => handlersRef.current.onJoined?.(payload),
      onSignal: (payload) => handlersRef.current.onSignal?.(payload),
      onChat: (message) => handlersRef.current.onChat?.(message),
      onParticipantUpdate: (payload) => handlersRef.current.onParticipantUpdate?.(payload),
      onEnd: (payload) => handlersRef.current.onEnd?.(payload),
      onReconnect: () => {
        const roomId = activeRoomRef.current;
        if (roomId) {
          void joinInterviewSocketRoom(roomId).then((joined) => {
            if (joined.ok) handlersRef.current.onReconnect?.();
          });
        }
      }
    });
  }, []);

  const joinRoom = useCallback((roomId: string) => {
    activeRoomRef.current = roomId;
    return joinInterviewSocketRoom(roomId);
  }, []);

  const sendSignal = useCallback((roomId: string, signal: WebRtcSignal) => {
    sendInterviewSignal(roomId, signal);
  }, []);

  const sendChat = useCallback((roomId: string, body: string) => {
    return sendInterviewChat(roomId, body);
  }, []);

  const updateParticipantStatus = useCallback((roomId: string, status: { muted?: boolean; cameraOff?: boolean }) => {
    updateInterviewParticipantStatus(roomId, status);
  }, []);

  const endRoom = useCallback((roomId: string) => {
    activeRoomRef.current = null;
    return endInterviewSocketRoom(roomId);
  }, []);

  const leaveRoom = useCallback((roomId: string) => {
    if (activeRoomRef.current === roomId) activeRoomRef.current = null;
    leaveInterviewSocketRoom(roomId);
  }, []);

  return useMemo(
    () => ({
      joinRoom,
      sendSignal,
      sendChat,
      updateParticipantStatus,
      endRoom,
      leaveRoom
    }),
    [joinRoom, sendSignal, sendChat, updateParticipantStatus, endRoom, leaveRoom]
  );
}
