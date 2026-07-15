"use client";

import type { ChatCompanyContact, ChatConversation, ChatInternContact } from "@/lib/chat-portal";
import { Button } from "@/components/ui/button";
import { conversationTitle, formatListTime, type ChatRole } from "@/components/dashboard/chat/chat-utils";
import { cn } from "@/lib/utils";

type Props = {
  role: ChatRole;
  conversations: ChatConversation[];
  selectedId: string | null;
  contacts: Array<ChatInternContact | ChatCompanyContact>;
  showNewChat: boolean;
  onToggleNewChat: () => void;
  onSelectConversation: (id: string) => void;
  onStartChat: (contact: ChatInternContact | ChatCompanyContact) => void;
  className?: string;
};

export function ChatListPanel({
  role,
  conversations,
  selectedId,
  contacts,
  showNewChat,
  onToggleNewChat,
  onSelectConversation,
  onStartChat,
  className
}: Props) {
  return (
    <aside
      className={cn(
        "flex h-full min-h-0 flex-col rounded-2xl border border-slate-200/70 bg-white/90 shadow-sm dark:border-slate-800/70 dark:bg-slate-950/30",
        className
      )}
    >
      <div className="flex items-center justify-between gap-2 border-b border-slate-200/70 px-3 py-3 dark:border-slate-800/70">
        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Messages</p>
        <Button type="button" size="sm" variant="secondary" onClick={onToggleNewChat}>
          {showNewChat ? "Close" : "New"}
        </Button>
      </div>

      {showNewChat ? (
        <div className="max-h-40 space-y-0.5 overflow-y-auto border-b border-slate-200/70 p-2 dark:border-slate-800/70">
          {contacts.length === 0 ? (
            <p className="px-2 py-2 text-xs text-slate-500">Apply to an internship to unlock messaging.</p>
          ) : null}
          {contacts.map((contact) => {
            const key =
              role === "intern"
                ? (contact as ChatInternContact).companyId
                : (contact as ChatCompanyContact).internProfileId;
            const label =
              role === "intern"
                ? (contact as ChatInternContact).companyName
                : (contact as ChatCompanyContact).internName;
            const subtitle = contact.internshipRole;
            return (
              <button
                key={key}
                type="button"
                onClick={() => onStartChat(contact)}
                className="w-full rounded-lg px-2.5 py-2 text-left transition hover:bg-slate-50 dark:hover:bg-slate-900"
              >
                <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{label}</p>
                {subtitle ? <p className="text-[11px] text-slate-500">{subtitle}</p> : null}
              </button>
            );
          })}
        </div>
      ) : null}

      <ul className="min-h-0 flex-1 overflow-y-auto p-2">
        {conversations.length === 0 ? (
          <li className="px-2 py-6 text-center text-sm text-slate-500">No conversations yet.</li>
        ) : null}
        {conversations.map((conversation) => {
          const active = conversation._id === selectedId;
          const unread = conversation.unreadCount || 0;
          return (
            <li key={conversation._id}>
              <button
                type="button"
                onClick={() => onSelectConversation(conversation._id)}
                className={cn(
                  "mb-1 w-full rounded-xl px-3 py-2.5 text-left transition",
                  active
                    ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                    : unread > 0
                      ? "bg-primary-50/70 dark:bg-primary-950/20"
                      : "hover:bg-slate-50 dark:hover:bg-slate-900/60"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="truncate text-sm font-semibold">{conversationTitle(conversation, role)}</p>
                  <span className={cn("shrink-0 text-[10px]", active ? "text-white/70 dark:text-slate-600" : "text-slate-400")}>
                    {formatListTime(conversation.lastMessageAt)}
                  </span>
                </div>
                <div className="mt-1 flex items-center justify-between gap-2">
                  <p
                    className={cn(
                      "line-clamp-1 text-xs",
                      active ? "text-white/80 dark:text-slate-600" : "text-slate-500"
                    )}
                  >
                    {conversation.lastMessageText || "No messages yet"}
                  </p>
                  {unread > 0 ? (
                    <span className="shrink-0 rounded-full bg-primary-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                      {unread > 9 ? "9+" : unread}
                    </span>
                  ) : null}
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
