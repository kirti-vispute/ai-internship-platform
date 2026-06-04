"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MessageSquare } from "lucide-react";
import { SectionPanel } from "@/components/dashboard/section-panel";
import { AppIcon } from "@/components/icons/app-icon";
import { FEATURE_FLAGS } from "@/constants/featureFlags";
import { type ChatConversation, fetchChatConversations } from "@/lib/chat-portal";
import { useChatSocket } from "@/lib/use-chat-socket";
import { cn } from "@/lib/utils";

type RecentMessagesWidgetProps = {
  role: "intern" | "company";
  chatHref: string;
};

function formatRelative(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function titleFor(conversation: ChatConversation, role: "intern" | "company") {
  return role === "intern" ? conversation.company?.companyName || "Company" : conversation.internProfile?.fullName || "Intern";
}

export function RecentMessagesWidget({ role, chatHref }: RecentMessagesWidgetProps) {
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    if (!FEATURE_FLAGS.ENABLE_CHAT) {
      setConversations([]);
      setLoading(false);
      return;
    }
    try {
      const payload = await fetchChatConversations();
      setConversations((payload.conversations || []).slice(0, 5));
    } catch {
      setConversations([]);
    } finally {
      setLoading(false);
    }
  }

  useChatSocket({
    onConversationUpdated: () => void load(),
    onMessage: () => void load(),
    onUnreadUpdated: () => void load()
  });

  useEffect(() => {
    void load();
  }, []);

  if (!FEATURE_FLAGS.ENABLE_CHAT) return null;

  return (
    <SectionPanel title="Recent Messages" subtitle="Latest conversations with unread indicators." titleIcon={MessageSquare}>
      {loading ? (
        <p className="text-sm text-slate-500">Loading messages…</p>
      ) : conversations.length === 0 ? (
        <p className="text-sm text-slate-600 dark:text-slate-300">No messages yet. Start a conversation from Messages.</p>
      ) : (
        <ul className="space-y-2">
          {conversations.map((conversation) => {
            const unread = conversation.unreadCount || 0;
            const href = `${chatHref}?conversation=${conversation._id}`;
            return (
              <li key={conversation._id}>
                <Link
                  href={href}
                  className={cn(
                    "flex items-start justify-between gap-3 rounded-xl border px-3 py-2.5 transition hover:border-primary-300/50 hover:bg-white dark:hover:bg-slate-900",
                    unread > 0
                      ? "border-primary-300/40 bg-primary-50/50 dark:border-primary-700/40 dark:bg-primary-950/20"
                      : "border-slate-200/80 bg-slate-50/40 dark:border-slate-700/80 dark:bg-slate-900/30"
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <AppIcon icon={MessageSquare} size="xs" className="text-primary-600 dark:text-primary-400" />
                      <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{titleFor(conversation, role)}</p>
                      {unread > 0 ? <span className="h-2 w-2 shrink-0 rounded-full bg-primary-600" /> : null}
                    </div>
                    <p className="mt-1 line-clamp-1 text-xs text-slate-600 dark:text-slate-300">
                      {conversation.lastMessageText || "No messages yet"}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-[11px] text-slate-500">{formatRelative(conversation.lastMessageAt)}</p>
                    {unread > 0 ? (
                      <span className="mt-1 inline-flex rounded-full bg-primary-600 px-2 py-0.5 text-[10px] font-bold text-white">
                        {unread > 9 ? "9+" : unread}
                      </span>
                    ) : null}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
      <div className="mt-3">
        <Link href={chatHref} className="text-link text-xs">
          Open all messages
        </Link>
      </div>
    </SectionPanel>
  );
}
