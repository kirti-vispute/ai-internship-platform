"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ChatContextPanel } from "@/components/dashboard/chat/chat-context-panel";
import { ChatListPanel } from "@/components/dashboard/chat/chat-list-panel";
import { ChatThreadPanel } from "@/components/dashboard/chat/chat-thread-panel";
import {
  createOptimisticMessage,
  replaceOptimisticMessage,
  type ChatRole
} from "@/components/dashboard/chat/chat-utils";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { useToast } from "@/components/ui/toast";
import { FEATURE_FLAGS } from "@/constants/featureFlags";
import {
  type ChatCompanyContact,
  type ChatConversation,
  type ChatInternContact,
  type ChatMessage,
  fetchChatContacts,
  fetchChatConversations,
  fetchChatMessages,
  markChatConversationRead,
  openChatConversation,
  sendChatMessage
} from "@/lib/chat-portal";
import { useChatSocket } from "@/lib/use-chat-socket";
import { cn } from "@/lib/utils";

const MESSAGE_PAGE_SIZE = 30;

type ChatWorkspaceProps = {
  role: ChatRole;
};

type MobileView = "list" | "thread";

function findContactForConversation(
  conversation: ChatConversation | null,
  contacts: Array<ChatInternContact | ChatCompanyContact>,
  role: ChatRole
) {
  if (!conversation) return null;
  if (role === "intern") {
    return contacts.find((c) => (c as ChatInternContact).companyId === conversation.company?._id) ?? null;
  }
  return contacts.find((c) => (c as ChatCompanyContact).internProfileId === conversation.internProfile?._id) ?? null;
}

export function ChatWorkspace({ role }: ChatWorkspaceProps) {
  const searchParams = useSearchParams();
  const deepLinkConversationId = searchParams.get("conversation");
  const { pushToast } = useToast();

  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [contacts, setContacts] = useState<Array<ChatInternContact | ChatCompanyContact>>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unreadTotal, setUnreadTotal] = useState(0);
  const [showNewChat, setShowNewChat] = useState(false);
  const [contextOpen, setContextOpen] = useState(true);
  const [mobileView, setMobileView] = useState<MobileView>("list");

  const selectedIdRef = useRef<string | null>(null);
  selectedIdRef.current = selectedId;

  const selectedConversation = useMemo(
    () => conversations.find((item) => item._id === selectedId) || null,
    [conversations, selectedId]
  );

  const activeContact = useMemo(
    () => findContactForConversation(selectedConversation, contacts, role),
    [selectedConversation, contacts, role]
  );

  const refreshConversations = useCallback(async () => {
    const payload = await fetchChatConversations();
    setConversations(payload.conversations || []);
    setUnreadTotal(payload.unreadTotal || 0);
    return payload.conversations || [];
  }, []);

  const { joinConversation, sendMessage: sendSocketMessage } = useChatSocket({
    onMessage: (message) => {
      if (message.conversation === selectedIdRef.current) {
        setMessages((prev) => {
          if (prev.some((item) => item._id === message._id)) return prev;
          const optimisticMatches = prev.filter(
            (item) => item._id.startsWith("optimistic-") && item.body === message.body
          );
          const withoutOptimistic =
            optimisticMatches.length === 1
              ? prev.filter((item) => item._id !== optimisticMatches[0]._id)
              : prev.filter((item) => !item._id.startsWith("optimistic-") || item.body !== message.body);
          return [...withoutOptimistic, message];
        });
        void markChatConversationRead(message.conversation).then(() => refreshConversations());
      } else {
        void refreshConversations();
      }
    },
    onMessageStatus: (payload) => {
      const messageId = payload.messageId || payload._id;
      const conversationId = payload.conversationId || payload.conversation;
      if (!messageId || conversationId !== selectedIdRef.current) return;
      setMessages((prev) =>
        prev.map((item) =>
          item._id === messageId
            ? {
                ...item,
                status: payload.status,
                deliveredAt: payload.deliveredAt ?? item.deliveredAt,
                readAt: payload.readAt ?? item.readAt
              }
            : item
        )
      );
    },
    onConversationUpdated: (conversation) => {
      setConversations((prev) => {
        const next = prev.filter((item) => item._id !== conversation._id);
        return [conversation, ...next].sort((a, b) => {
          const aTime = new Date(a.lastMessageAt || 0).getTime();
          const bTime = new Date(b.lastMessageAt || 0).getTime();
          return bTime - aTime;
        });
      });
    },
    onUnreadUpdated: (total) => setUnreadTotal(total)
  });

  const loadConversationMessages = useCallback(
    async (conversationId: string, options?: { before?: string; append?: boolean }) => {
      const payload = await fetchChatMessages(conversationId, {
        before: options?.before,
        limit: MESSAGE_PAGE_SIZE
      });
      const incoming = payload.messages || [];
      setHasMore(incoming.length >= MESSAGE_PAGE_SIZE);
      setMessages((prev) => (options?.append ? [...incoming, ...prev] : incoming));
      setConversations((prev) => prev.map((item) => (item._id === conversationId ? payload.conversation : item)));

      if (!options?.append) {
        await markChatConversationRead(conversationId);
        setConversations((prev) =>
          prev.map((item) =>
            item._id === conversationId
              ? { ...item, unreadCount: 0, ...(role === "intern" ? { unreadIntern: 0 } : { unreadCompany: 0 }) }
              : item
          )
        );
        await joinConversation(conversationId);
      }
    },
    [joinConversation, role]
  );

  useEffect(() => {
    if (!FEATURE_FLAGS.ENABLE_CHAT) {
      setLoading(false);
      return undefined;
    }

    let cancelled = false;

    async function bootstrap() {
      try {
        setLoading(true);
        setError(null);
        const [list, contactList] = await Promise.all([refreshConversations(), fetchChatContacts()]);
        if (cancelled) return;
        setContacts(contactList);
        const initialId =
          deepLinkConversationId && list.some((item) => item._id === deepLinkConversationId)
            ? deepLinkConversationId
            : list[0]?._id;
        if (initialId) {
          setSelectedId(initialId);
          setLoadingMessages(true);
          await loadConversationMessages(initialId);
          if (!cancelled && deepLinkConversationId) setMobileView("thread");
        }
      } catch (err) {
        if (!cancelled) setError((err as Error).message || "Failed to load chat.");
      } finally {
        if (!cancelled) {
          setLoading(false);
          setLoadingMessages(false);
        }
      }
    }

    void bootstrap();
    return () => {
      cancelled = true;
    };
    // Only re-bootstrap when deep-link conversation changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deepLinkConversationId]);

  async function handleSelectConversation(conversationId: string) {
    try {
      setSelectedId(conversationId);
      setMobileView("thread");
      setLoadingMessages(true);
      setMessages([]);
      await loadConversationMessages(conversationId);
    } catch (err) {
      pushToast({ title: "Chat error", message: (err as Error).message, variant: "error" });
    } finally {
      setLoadingMessages(false);
    }
  }

  async function handleLoadMore() {
    if (!selectedId || loadingMore || !hasMore) return;
    const oldest = messages[0];
    if (!oldest) return;
    try {
      setLoadingMore(true);
      await loadConversationMessages(selectedId, { before: oldest.createdAt, append: true });
    } catch (err) {
      pushToast({ title: "Could not load messages", message: (err as Error).message, variant: "error" });
    } finally {
      setLoadingMore(false);
    }
  }

  async function handleStartChat(contact: ChatInternContact | ChatCompanyContact) {
    try {
      const payload =
        role === "intern"
          ? { companyId: (contact as ChatInternContact).companyId }
          : { internProfileId: (contact as ChatCompanyContact).internProfileId };
      const conversation = await openChatConversation(payload);
      setShowNewChat(false);
      const list = await refreshConversations();
      if (!list.some((item) => item._id === conversation._id)) {
        setConversations((prev) => [conversation, ...prev]);
      }
      await handleSelectConversation(conversation._id);
    } catch (err) {
      pushToast({ title: "Unable to start chat", message: (err as Error).message, variant: "error" });
    }
  }

  async function handleSendMessage() {
    if (!selectedId || !draft.trim()) return;
    const body = draft.trim();
    const optimistic = createOptimisticMessage(selectedId, role, body);
    setDraft("");
    setMessages((prev) => [...prev, optimistic]);
    setSending(true);

    try {
      const socketResult = await sendSocketMessage(selectedId, body);
      if (socketResult.ok && socketResult.message) {
        setMessages((prev) => replaceOptimisticMessage(prev, optimistic._id, socketResult.message!));
        if (socketResult.conversation) {
          setConversations((prev) => {
            const next = prev.filter((item) => item._id !== socketResult.conversation?._id);
            return [socketResult.conversation!, ...next];
          });
        }
        return;
      }

      const fallback = await sendChatMessage(selectedId, body);
      setMessages((prev) => replaceOptimisticMessage(prev, optimistic._id, fallback.message));
      setConversations((prev) => {
        const next = prev.filter((item) => item._id !== fallback.conversation._id);
        return [fallback.conversation, ...next];
      });
    } catch (err) {
      setMessages((prev) => prev.filter((m) => m._id !== optimistic._id));
      setDraft(body);
      pushToast({ title: "Message not sent", message: (err as Error).message, variant: "error" });
    } finally {
      setSending(false);
    }
  }

  if (!FEATURE_FLAGS.ENABLE_CHAT) {
    return (
      <div className="dashboard-stack">
        <DashboardPageHeader eyebrow="Messaging" title="Messages" subtitle="Messaging is disabled in this environment." />
        <EmptyState title="Chat disabled" hint="Set NEXT_PUBLIC_ENABLE_CHAT=true to use messaging." />
      </div>
    );
  }

  return (
    <div className="dashboard-stack flex h-[calc(100dvh-11rem)] min-h-[32rem] flex-col gap-4" data-chat-workspace>
      <DashboardPageHeader
        className="shrink-0"
        eyebrow="Messaging"
        title="Messages"
        subtitle={
          role === "intern"
            ? "Chat with companies you have applied to."
            : "Chat with candidates from your hiring pipeline."
        }
        actions={
          unreadTotal > 0 ? (
            <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white dark:bg-slate-100 dark:text-slate-900">
              {unreadTotal} unread
            </span>
          ) : undefined
        }
      />

      {loading ? <div className="shrink-0 text-sm text-slate-500">Loading conversations…</div> : null}
      {error ? (
        <div className="shrink-0 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">
          {error}
        </div>
      ) : null}

      {!loading && !error ? (
        <div
          data-chat-ui
          className={cn(
            "grid min-h-0 flex-1 items-stretch gap-3",
            "grid-cols-1 md:grid-cols-[280px_minmax(0,1fr)] xl:grid-cols-[280px_minmax(0,1fr)_240px]"
          )}
        >
          <ChatListPanel
            role={role}
            conversations={conversations}
            selectedId={selectedId}
            contacts={contacts}
            showNewChat={showNewChat}
            onToggleNewChat={() => setShowNewChat((v) => !v)}
            onSelectConversation={(id) => void handleSelectConversation(id)}
            onStartChat={(contact) => void handleStartChat(contact)}
            className={cn("h-full min-h-0", mobileView === "thread" ? "hidden md:flex" : "flex")}
          />

          <ChatThreadPanel
            role={role}
            conversation={selectedConversation}
            messages={messages}
            draft={draft}
            sending={sending}
            loadingMessages={loadingMessages}
            loadingMore={loadingMore}
            hasMore={hasMore}
            contextOpen={contextOpen}
            showBackButton
            onBack={() => setMobileView("list")}
            onToggleContext={() => setContextOpen((v) => !v)}
            onDraftChange={setDraft}
            onSend={() => void handleSendMessage()}
            onLoadMore={() => void handleLoadMore()}
            className={cn("h-full min-h-0", mobileView === "list" ? "hidden md:flex" : "flex")}
          />

          <ChatContextPanel
            role={role}
            conversation={selectedConversation}
            contact={activeContact}
            open={contextOpen && Boolean(selectedConversation)}
            onClose={() => setContextOpen(false)}
            className={cn(
              "hidden h-full min-h-0",
              selectedConversation && contextOpen && "md:flex"
            )}
          />
        </div>
      ) : null}
    </div>
  );
}
