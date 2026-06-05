"use client";

import { useEffect, useRef } from "react";
import { ArrowLeft, Loader2, PanelRightClose, PanelRightOpen } from "lucide-react";
import { ChatMessageInput } from "@/components/dashboard/chat/chat-message-input";
import {
  conversationTitle,
  formatChatTime,
  groupMessages,
  type ChatRole
} from "@/components/dashboard/chat/chat-utils";
import { MessageStatusIndicator } from "@/components/dashboard/message-status-indicator";
import { EmptyState } from "@/components/dashboard/empty-state";
import { AppIcon } from "@/components/icons/app-icon";
import { Button } from "@/components/ui/button";
import type { ChatConversation, ChatMessage } from "@/lib/chat-portal";
import { cn } from "@/lib/utils";

type Props = {
  role: ChatRole;
  conversation: ChatConversation | null;
  messages: ChatMessage[];
  draft: string;
  sending: boolean;
  loadingMessages: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  contextOpen: boolean;
  showBackButton?: boolean;
  onBack?: () => void;
  onToggleContext?: () => void;
  onDraftChange: (value: string) => void;
  onSend: () => void;
  onLoadMore: () => void;
  className?: string;
};

export function ChatThreadPanel({
  role,
  conversation,
  messages,
  draft,
  sending,
  loadingMessages,
  loadingMore,
  hasMore,
  contextOpen,
  showBackButton,
  onBack,
  onToggleContext,
  onDraftChange,
  onSend,
  onLoadMore,
  className
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const prevLengthRef = useRef(0);
  const prevConversationRef = useRef<string | null>(null);

  useEffect(() => {
    const conversationChanged = conversation?._id !== prevConversationRef.current;
    prevConversationRef.current = conversation?._id ?? null;

    const grew = messages.length > prevLengthRef.current;
    prevLengthRef.current = messages.length;

    if (!bottomRef.current) return;
    if (conversationChanged || grew) {
      bottomRef.current.scrollIntoView({ behavior: conversationChanged ? "auto" : "smooth" });
    }
  }, [conversation?._id, messages.length, messages]);

  if (!conversation) {
    return (
      <section className="flex h-full min-h-[480px] items-center justify-center rounded-2xl border border-slate-200/70 bg-white/90 dark:border-slate-800/70 dark:bg-slate-950/30">
        <EmptyState title="Select a conversation" hint="Choose a thread or start a new chat." />
      </section>
    );
  }

  const groups = groupMessages(messages, role);
  const subtitle =
    role === "intern"
      ? conversation.company?.verificationStatus
        ? `Company · ${conversation.company.verificationStatus}`
        : "Company conversation"
      : conversation.internProfile?.email || "Candidate conversation";

  return (
    <section className={cn("flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200/70 bg-white/90 shadow-sm dark:border-slate-800/70 dark:bg-slate-950/30", className)}>
      <header className="flex shrink-0 items-center gap-2 border-b border-slate-200/70 px-3 py-3 dark:border-slate-800/70">
        {showBackButton ? (
          <Button type="button" size="sm" variant="ghost" onClick={onBack} className="shrink-0 px-2 lg:hidden">
            <AppIcon icon={ArrowLeft} size="sm" />
          </Button>
        ) : null}
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
            {conversationTitle(conversation, role)}
          </h3>
          <p className="truncate text-[11px] text-slate-500">{subtitle}</p>
        </div>
        {onToggleContext ? (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={onToggleContext}
            className="hidden shrink-0 px-2 md:inline-flex xl:hidden"
            aria-label={contextOpen ? "Hide details" : "Show details"}
          >
            <AppIcon icon={contextOpen ? PanelRightClose : PanelRightOpen} size="sm" />
          </Button>
        ) : null}
      </header>

      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-3 py-4 sm:px-4">
        {hasMore ? (
          <div className="mb-3 flex justify-center">
            <Button type="button" size="sm" variant="secondary" disabled={loadingMore} onClick={onLoadMore}>
              {loadingMore ? (
                <>
                  <AppIcon icon={Loader2} size="xs" className="animate-spin" />
                  Loading…
                </>
              ) : (
                "Load older messages"
              )}
            </Button>
          </div>
        ) : null}

        {loadingMessages ? (
          <div className="flex items-center justify-center py-12 text-sm text-slate-500">
            <AppIcon icon={Loader2} size="sm" className="mr-2 animate-spin" />
            Loading messages…
          </div>
        ) : messages.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500">No messages yet. Say hello to start.</p>
        ) : (
          <div className="space-y-4">
            {groups.map((group) => (
              <div key={group.id} className={cn("flex", group.mine ? "justify-end" : "justify-start")}>
                <div className={cn("flex max-w-[85%] flex-col gap-1", group.mine ? "items-end" : "items-start")}>
                  {group.messages.map((message, index) => (
                    <div
                      key={message._id}
                      className={cn(
                        "rounded-2xl px-3 py-2 text-sm shadow-sm",
                        group.mine
                          ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                          : "border border-slate-200/80 bg-slate-50 text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100",
                        index === 0 ? "" : group.mine ? "rounded-tr-md" : "rounded-tl-md"
                      )}
                    >
                      <p className="whitespace-pre-wrap break-words">{message.body}</p>
                    </div>
                  ))}
                  <div
                    className={cn(
                      "flex items-center gap-1 px-1 text-[10px]",
                      group.mine ? "text-slate-400" : "text-slate-400"
                    )}
                  >
                    <span>{formatChatTime(group.messages[group.messages.length - 1].createdAt)}</span>
                    {group.mine ? (
                      <MessageStatusIndicator
                        status={group.messages[group.messages.length - 1].status || "sent"}
                        className={group.mine ? "text-slate-400 dark:text-slate-500" : undefined}
                      />
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <ChatMessageInput value={draft} onChange={onDraftChange} onSend={onSend} sending={sending} />
    </section>
  );
}
