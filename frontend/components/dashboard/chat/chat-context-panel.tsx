"use client";

import Link from "next/link";
import { Building2, ExternalLink, UserRound, X } from "lucide-react";
import type { ChatCompanyContact, ChatConversation, ChatInternContact } from "@/lib/chat-portal";
import { conversationTitle, type ChatRole } from "@/components/dashboard/chat/chat-utils";
import { AppIcon } from "@/components/icons/app-icon";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  role: ChatRole;
  conversation: ChatConversation | null;
  contact?: ChatInternContact | ChatCompanyContact | null;
  open: boolean;
  onClose?: () => void;
  className?: string;
};

export function ChatContextPanel({ role, conversation, contact, open, onClose, className }: Props) {
  if (!conversation || !open) return null;

  const title = conversationTitle(conversation, role);

  return (
    <aside
      className={cn(
        "flex h-full min-h-0 flex-col rounded-2xl border border-slate-200/70 bg-white/90 shadow-sm dark:border-slate-800/70 dark:bg-slate-950/30",
        className
      )}
    >
      <div className="flex items-center justify-between gap-2 border-b border-slate-200/70 px-3 py-3 dark:border-slate-800/70">
        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Details</p>
        {onClose ? (
          <Button type="button" size="sm" variant="ghost" className="px-2 xl:hidden" onClick={onClose}>
            <AppIcon icon={X} size="sm" />
          </Button>
        ) : null}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
            <AppIcon icon={role === "intern" ? Building2 : UserRound} size="sm" className="text-slate-600 dark:text-slate-300" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-slate-900 dark:text-slate-100">{title}</p>
            {role === "intern" ? (
              <>
                {conversation.company?.verificationStatus ? (
                  <span className="mt-1 inline-block rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium uppercase text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    {conversation.company.verificationStatus}
                  </span>
                ) : null}
                {contact && "internshipRole" in contact && contact.internshipRole ? (
                  <p className="mt-2 text-xs text-slate-500">Role: {contact.internshipRole}</p>
                ) : null}
              </>
            ) : (
              <>
                {conversation.internProfile?.email ? (
                  <p className="mt-1 truncate text-xs text-slate-500">{conversation.internProfile.email}</p>
                ) : null}
                {contact && "internshipRole" in contact && contact.internshipRole ? (
                  <p className="mt-2 text-xs text-slate-500">Applied for: {contact.internshipRole}</p>
                ) : null}
                <span className="mt-2 inline-block rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                  Active candidate
                </span>
              </>
            )}
          </div>
        </div>

        <div className="mt-6 space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Quick actions</p>
          {role === "intern" ? (
            <Link
              href="/dashboard/intern/internships/search"
              className="flex items-center gap-2 rounded-lg border border-slate-200/70 px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-900"
            >
              <AppIcon icon={ExternalLink} size="xs" />
              Browse internships
            </Link>
          ) : (
            <Link
              href="/dashboard/company/hiring/applicants"
              className="flex items-center gap-2 rounded-lg border border-slate-200/70 px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-900"
            >
              <AppIcon icon={ExternalLink} size="xs" />
              View applicants
            </Link>
          )}
        </div>
      </div>
    </aside>
  );
}
