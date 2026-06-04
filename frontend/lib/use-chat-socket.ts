"use client";

import { useEffect, useRef } from "react";
import { io, type Socket } from "socket.io-client";
import type { ChatConversation, ChatMessage } from "@/lib/chat-portal";
import { resolveApiBaseUrlForSocket } from "@/lib/chat-portal";
import { getAuthSession } from "@/lib/session";
import { FEATURE_FLAGS } from "@/constants/featureFlags";

type MessageStatusPayload = {
  messageId: string;
  conversationId: string;
  status: "sent" | "delivered" | "read";
  deliveredAt?: string | null;
  readAt?: string | null;
};

type ChatSocketHandlers = {
  onMessage?: (message: ChatMessage) => void;
  onConversationUpdated?: (conversation: ChatConversation) => void;
  onUnreadUpdated?: (unreadTotal: number) => void;
  onMessageStatus?: (payload: MessageStatusPayload) => void;
  onNotification?: (notification: Record<string, unknown>) => void;
};

export function useChatSocket(handlers: ChatSocketHandlers) {
  const socketRef = useRef<Socket | null>(null);
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    if (!FEATURE_FLAGS.ENABLE_CHAT) return undefined;

    const token = getAuthSession()?.token;
    if (!token) return undefined;

    const socket = io(resolveApiBaseUrlForSocket(), {
      auth: { token },
      transports: ["websocket", "polling"]
    });

    socketRef.current = socket;

    socket.on("message:new", (message: ChatMessage) => {
      handlersRef.current.onMessage?.(message);
    });

    socket.on("conversation:updated", (conversation: ChatConversation) => {
      handlersRef.current.onConversationUpdated?.(conversation);
    });

    socket.on("unread:updated", (payload: { unreadTotal?: number }) => {
      handlersRef.current.onUnreadUpdated?.(payload?.unreadTotal || 0);
    });

    socket.on("message:status", (payload: MessageStatusPayload) => {
      handlersRef.current.onMessageStatus?.(payload);
    });

    socket.on("notification:new", (notification: Record<string, unknown>) => {
      handlersRef.current.onNotification?.(notification);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  function joinConversation(conversationId: string) {
    return new Promise<boolean>((resolve) => {
      const socket = socketRef.current;
      if (!socket?.connected) {
        resolve(false);
        return;
      }
      socket.emit("conversation:join", { conversationId }, (response?: { ok?: boolean }) => {
        resolve(Boolean(response?.ok));
      });
    });
  }

  function sendMessage(conversationId: string, body: string) {
    return new Promise<{ ok: boolean; message?: ChatMessage; conversation?: ChatConversation; messageText?: string }>((resolve) => {
      const socket = socketRef.current;
      if (!socket?.connected) {
        resolve({ ok: false, messageText: "Socket not connected" });
        return;
      }
      socket.emit(
        "message:send",
        { conversationId, body },
        (response?: { ok?: boolean; message?: ChatMessage | string; conversation?: ChatConversation }) => {
          if (response?.ok && response.message && typeof response.message === "object") {
            resolve({ ok: true, message: response.message, conversation: response.conversation });
            return;
          }
          const errorText = typeof response?.message === "string" ? response.message : "Failed to send message";
          resolve({ ok: false, messageText: errorText });
        }
      );
    });
  }

  return {
    joinConversation,
    sendMessage
  };
}
