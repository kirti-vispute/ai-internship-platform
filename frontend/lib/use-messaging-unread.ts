"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchChatUnreadCount } from "@/lib/chat-portal";
import { useChatSocket } from "@/lib/use-chat-socket";
import { FEATURE_FLAGS } from "@/constants/featureFlags";

const POLL_MS = 30000;

export function useMessagingUnread() {
  const [messageUnread, setMessageUnread] = useState(0);

  const refresh = useCallback(async () => {
    if (!FEATURE_FLAGS.ENABLE_CHAT) {
      setMessageUnread(0);
      return;
    }
    try {
      setMessageUnread(await fetchChatUnreadCount());
    } catch {
      setMessageUnread(0);
    }
  }, []);

  useChatSocket({
    onUnreadUpdated: (total) => setMessageUnread(total),
    onConversationUpdated: () => void refresh(),
    onMessage: () => void refresh()
  });

  useEffect(() => {
    void refresh();
    if (!FEATURE_FLAGS.ENABLE_CHAT) return undefined;
    const timer = setInterval(() => void refresh(), POLL_MS);
    return () => clearInterval(timer);
  }, [refresh]);

  return { messageUnread, refreshMessageUnread: refresh };
}
