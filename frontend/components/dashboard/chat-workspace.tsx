"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { MessageStatusIndicator } from "@/components/dashboard/message-status-indicator";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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

type ChatWorkspaceProps = {
  role: "intern" | "company";
};

function formatTimestamp(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function conversationTitle(conversation: ChatConversation, role: "intern" | "company") {
  if (role === "intern") {
    return conversation.company?.companyName || "Company";
  }
  return conversation.internProfile?.fullName || "Intern";
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
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unreadTotal, setUnreadTotal] = useState(0);
  const [showNewChat, setShowNewChat] = useState(false);

  const selectedConversation = useMemo(
    () => conversations.find((item) => item._id === selectedId) || null,
    [conversations, selectedId]
  );

  const refreshConversations = useCallback(async () => {
    const payload = await fetchChatConversations();
    setConversations(payload.conversations || []);
    setUnreadTotal(payload.unreadTotal || 0);
    return payload.conversations || [];
  }, []);

  const { joinConversation, sendMessage: sendSocketMessage } = useChatSocket({
    onMessage: (message) => {
      if (message.conversation === selectedId) {
        setMessages((prev) => {
          if (prev.some((item) => item._id === message._id)) return prev;
          return [...prev, message];
        });
      }
      void refreshConversations();
    },
    onMessageStatus: (payload) => {
      if (payload.conversationId !== selectedId) return;
      setMessages((prev) =>
        prev.map((item) =>
          item._id === payload.messageId
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

  async function loadConversationMessages(conversationId: string) {
    const payload = await fetchChatMessages(conversationId);
    setMessages(payload.messages || []);
    setConversations((prev) => prev.map((item) => (item._id === conversationId ? payload.conversation : item)));
    await markChatConversationRead(conversationId);
    setConversations((prev) =>
      prev.map((item) => (item._id === conversationId ? { ...item, unreadCount: 0, ...(role === "intern" ? { unreadIntern: 0 } : { unreadCompany: 0 }) } : item))
    );
    await joinConversation(conversationId);
  }

  useEffect(() => {
    if (!FEATURE_FLAGS.ENABLE_CHAT) {
      setLoading(false);
      return;
    }

    async function bootstrap() {
      try {
        setLoading(true);
        setError(null);
        const [list, contactList] = await Promise.all([refreshConversations(), fetchChatContacts()]);
        setContacts(contactList);
        const initialId =
          deepLinkConversationId && list.some((item) => item._id === deepLinkConversationId)
            ? deepLinkConversationId
            : list[0]?._id;
        if (initialId) {
          setSelectedId(initialId);
          await loadConversationMessages(initialId);
        }
      } catch (err) {
        setError((err as Error).message || "Failed to load chat.");
      } finally {
        setLoading(false);
      }
    }

    void bootstrap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSelectConversation(conversationId: string) {
    try {
      setSelectedId(conversationId);
      await loadConversationMessages(conversationId);
    } catch (err) {
      pushToast({ title: "Chat error", message: (err as Error).message, variant: "error" });
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
      const exists = list.some((item) => item._id === conversation._id);
      if (!exists) {
        setConversations((prev) => [conversation, ...prev]);
      }
      setSelectedId(conversation._id);
      await loadConversationMessages(conversation._id);
    } catch (err) {
      pushToast({ title: "Unable to start chat", message: (err as Error).message, variant: "error" });
    }
  }

  async function handleSendMessage() {
    if (!selectedId || !draft.trim()) return;
    const body = draft.trim();
    setSending(true);
    try {
      const socketResult = await sendSocketMessage(selectedId, body);
      if (socketResult.ok && socketResult.message) {
        setDraft("");
        setMessages((prev) => (prev.some((item) => item._id === socketResult.message?._id) ? prev : [...prev, socketResult.message!]));
        if (socketResult.conversation) {
          setConversations((prev) => {
            const next = prev.filter((item) => item._id !== socketResult.conversation?._id);
            return [socketResult.conversation!, ...next];
          });
        }
        await refreshConversations();
        return;
      }

      const fallback = await sendChatMessage(selectedId, body);
      setDraft("");
      setMessages((prev) => (prev.some((item) => item._id === fallback.message._id) ? prev : [...prev, fallback.message]));
      setConversations((prev) => {
        const next = prev.filter((item) => item._id !== fallback.conversation._id);
        return [fallback.conversation, ...next];
      });
      await refreshConversations();
    } catch (err) {
      pushToast({ title: "Message not sent", message: (err as Error).message, variant: "error" });
    } finally {
      setSending(false);
    }
  }

  if (!FEATURE_FLAGS.ENABLE_CHAT) {
    return (
      <div className="dashboard-stack">
        <DashboardPageHeader eyebrow="Messaging" title="HR Chat" subtitle="Real-time chat is currently disabled on this environment." />
        <EmptyState title="Chat disabled" hint="Set NEXT_PUBLIC_ENABLE_CHAT=true to use messaging." />
      </div>
    );
  }

  return (
    <div className="dashboard-stack">
      <DashboardPageHeader
        eyebrow="Messaging"
        title="HR Chat"
        subtitle="Real-time messaging with hiring teams. Available for companies you have applied to."
        actions={
          unreadTotal > 0 ? (
            <span className="rounded-full bg-primary-600 px-3 py-1 text-xs font-semibold text-white">{unreadTotal} unread</span>
          ) : undefined
        }
      />

      {loading && <div className="surface-muted p-4 text-sm text-slate-700 dark:text-slate-300">Loading conversations...</div>}
      {error && <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">{error}</div>}

      {!loading && !error && (
        <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="surface-subtle flex flex-col rounded-2xl border border-slate-200/80 p-3 dark:border-slate-800">
            <div className="mb-3 flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Conversations</p>
              <Button type="button" size="sm" variant="secondary" onClick={() => setShowNewChat((value) => !value)}>
                {showNewChat ? "Close" : "New"}
              </Button>
            </div>

            {showNewChat && (
              <div className="mb-3 max-h-44 space-y-1 overflow-y-auto rounded-xl border border-slate-200 bg-white p-2 dark:border-slate-700 dark:bg-slate-900">
                {contacts.length === 0 && <p className="px-2 py-1 text-xs text-slate-500">No eligible contacts yet. Apply to an internship to start chatting.</p>}
                {contacts.map((contact) => {
                  const key =
                    role === "intern"
                      ? (contact as ChatInternContact).companyId
                      : (contact as ChatCompanyContact).internProfileId;
                  const label =
                    role === "intern"
                      ? (contact as ChatInternContact).companyName
                      : (contact as ChatCompanyContact).internName;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => void handleStartChat(contact)}
                      className="w-full rounded-lg px-2 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            )}

            <ul className="max-h-[520px] space-y-1 overflow-y-auto">
              {conversations.length === 0 && (
                <li className="px-2 py-3 text-sm text-slate-500">No conversations yet. Start a new chat with a hiring contact.</li>
              )}
              {conversations.map((conversation) => {
                const active = conversation._id === selectedId;
                const unread = conversation.unreadCount || 0;
                return (
                  <li key={conversation._id}>
                    <button
                      type="button"
                      onClick={() => void handleSelectConversation(conversation._id)}
                      className={cn(
                        "w-full rounded-xl px-3 py-2.5 text-left transition",
                        active
                          ? "bg-primary-50 text-primary-800 dark:bg-primary-900/25 dark:text-primary-200"
                          : unread > 0
                            ? "border border-primary-200/60 bg-primary-50/40 dark:border-primary-800/50 dark:bg-primary-950/20"
                            : "hover:bg-white dark:hover:bg-slate-800"
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold">{conversationTitle(conversation, role)}</p>
                        {unread > 0 && (
                          <span className="rounded-full bg-primary-600 px-2 py-0.5 text-[10px] font-bold text-white">{unread > 9 ? "9+" : unread}</span>
                        )}
                      </div>
                      <p className="mt-1 line-clamp-1 text-xs text-slate-500">{conversation.lastMessageText || "No messages yet"}</p>
                      <p className="mt-1 text-[11px] text-slate-400">{formatTimestamp(conversation.lastMessageAt)}</p>
                    </button>
                  </li>
                );
              })}
            </ul>
          </aside>

          <section className="surface-subtle flex min-h-[520px] flex-col rounded-2xl border border-slate-200/80 dark:border-slate-800">
            {!selectedConversation ? (
              <div className="flex flex-1 items-center justify-center p-6">
                <EmptyState title="Select a conversation" hint="Choose a thread from the left or start a new chat." />
              </div>
            ) : (
              <>
                <header className="border-b border-slate-200 px-4 py-3 dark:border-slate-800">
                  <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">{conversationTitle(selectedConversation, role)}</h3>
                  <p className="text-xs text-slate-500">Messages are synced in real time</p>
                </header>

                <div className="flex-1 space-y-3 overflow-y-auto p-4">
                  {messages.length === 0 && <p className="text-sm text-slate-500">No messages yet. Say hello to start the conversation.</p>}
                  {messages.map((message) => {
                    const mine =
                      (role === "intern" && message.senderRole === "intern") ||
                      (role === "company" && message.senderRole === "company");
                    return (
                      <div key={message._id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
                        <div
                          className={cn(
                            "max-w-[80%] rounded-2xl px-3 py-2 text-sm shadow-sm",
                            mine
                              ? "bg-primary-600 text-white"
                              : "border border-slate-200 bg-white text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                          )}
                        >
                          <p className="whitespace-pre-wrap break-words">{message.body}</p>
                          <div className={cn("mt-1 flex items-center justify-end gap-1 text-[10px]", mine ? "text-primary-100" : "text-slate-400")}>
                            <span>{formatTimestamp(message.createdAt)}</span>
                            {mine ? <MessageStatusIndicator status={message.status || "sent"} /> : null}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <footer className="border-t border-slate-200 p-3 dark:border-slate-800">
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Textarea
                      value={draft}
                      onChange={(event) => setDraft(event.target.value)}
                      placeholder="Type your message..."
                      rows={2}
                      className="min-h-[72px] flex-1"
                      onKeyDown={(event) => {
                        if (event.key === "Enter" && !event.shiftKey) {
                          event.preventDefault();
                          void handleSendMessage();
                        }
                      }}
                    />
                    <Button type="button" onClick={() => void handleSendMessage()} disabled={sending || !draft.trim()}>
                      {sending ? "Sending..." : "Send"}
                    </Button>
                  </div>
                </footer>
              </>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
