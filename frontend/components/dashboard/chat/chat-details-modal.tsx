"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Briefcase, Calendar, ClipboardCheck, ExternalLink, Mail, ShieldCheck, UserRound, X } from "lucide-react";
import type { Application } from "@/lib/intern-portal";
import type { ChatCompanyContact, ChatConversation, ChatInternContact } from "@/lib/chat-portal";
import { conversationTitle, type ChatRole } from "@/components/dashboard/chat/chat-utils";
import { AppIcon } from "@/components/icons/app-icon";
import { cn } from "@/lib/utils";

type Props = {
  role: ChatRole;
  conversation: ChatConversation | null;
  contact?: ChatInternContact | ChatCompanyContact | null;
  application?: Application | null;
  open: boolean;
  onClose: () => void;
};

const AVATAR_TONES = [
  "bg-primary-500",
  "bg-violet-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-sky-500"
];

function toneForName(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_TONES[hash % AVATAR_TONES.length];
}

function initialsFor(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || "")
      .join("") || "?"
  );
}

function formatStatusLabel(status?: string) {
  return (status || "pending").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function DetailRow({ icon, label, value }: { icon: typeof Briefcase; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2.5">
      <AppIcon icon={icon} size="xs" className="mt-0.5 shrink-0 text-slate-400 dark:text-slate-500" />
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">{label}</p>
        <div className="mt-0.5 text-sm text-slate-700 dark:text-slate-200">{value}</div>
      </div>
    </div>
  );
}

export function ChatDetailsModal({ role, conversation, contact, application, open, onClose }: Props) {
  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!conversation) return null;

  const title = conversationTitle(conversation, role);
  const internshipRole = contact && "internshipRole" in contact ? contact.internshipRole : undefined;
  const latestRound =
    application?.interviewRounds && application.interviewRounds.length > 0
      ? application.interviewRounds[application.interviewRounds.length - 1]
      : null;

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          <motion.button
            type="button"
            aria-label="Close details"
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="chat-details-title"
            className="relative z-10 w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-800 dark:bg-slate-900"
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <div className="mb-5 flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <span
                  className={cn(
                    "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-base font-bold text-white",
                    toneForName(title)
                  )}
                >
                  {initialsFor(title)}
                </span>
                <div className="min-w-0">
                  <p id="chat-details-title" className="font-semibold text-slate-900 dark:text-slate-100">
                    {title}
                  </p>
                  {role === "intern" && conversation.company?.verificationStatus ? (
                    <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium uppercase text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                      <AppIcon icon={ShieldCheck} size="xs" className="text-current" />
                      {conversation.company.verificationStatus}
                    </span>
                  ) : null}
                  {role === "company" ? (
                    <span className="mt-1 inline-block rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                      Active candidate
                    </span>
                  ) : null}
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4">
              {role === "intern" ? <DetailRow icon={UserRound} label="Recruiter" value="HR" /> : null}
              {internshipRole ? <DetailRow icon={Briefcase} label="Internship" value={internshipRole} /> : null}

              {role === "intern" && conversation.company?.companyEmail ? (
                <DetailRow icon={Mail} label="Contact Email" value={conversation.company.companyEmail} />
              ) : null}
              {role === "company" && conversation.internProfile?.email ? (
                <DetailRow icon={Mail} label="Candidate Email" value={conversation.internProfile.email} />
              ) : null}

              {role === "intern" && application ? (
                <DetailRow
                  icon={ClipboardCheck}
                  label="Application Status"
                  value={
                    <span className="inline-flex rounded-full bg-primary-50 px-2 py-0.5 text-xs font-semibold text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
                      {formatStatusLabel(application.status)}
                    </span>
                  }
                />
              ) : null}

              {role === "intern" ? (
                <DetailRow
                  icon={Calendar}
                  label="Interview Status"
                  value={
                    latestRound ? (
                      <>
                        <span className="font-medium">{formatStatusLabel(latestRound.status)}</span>
                        {latestRound.interviewDate ? (
                          <span className="block text-xs text-slate-500 dark:text-slate-400">
                            {new Date(latestRound.interviewDate).toLocaleDateString()}
                            {latestRound.roundType ? ` · ${latestRound.roundType}` : ""}
                          </span>
                        ) : null}
                      </>
                    ) : (
                      <span className="text-slate-500 dark:text-slate-400">No interview scheduled yet</span>
                    )
                  }
                />
              ) : null}
            </div>

            <div className="mt-5 space-y-1.5 border-t border-slate-200/70 pt-4 dark:border-slate-800/70">
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                Quick actions
              </p>
              {role === "intern" ? (
                <>
                  <Link
                    href="/dashboard/intern/applications"
                    className="flex items-center gap-2 rounded-lg border border-slate-200/70 px-3 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                    onClick={onClose}
                  >
                    <AppIcon icon={ClipboardCheck} size="xs" />
                    View Application
                  </Link>
                  <Link
                    href="/dashboard/intern/internships/search"
                    className="flex items-center gap-2 rounded-lg border border-slate-200/70 px-3 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                    onClick={onClose}
                  >
                    <AppIcon icon={ExternalLink} size="xs" />
                    View Internship
                  </Link>
                  <Link
                    href="/dashboard/intern/interviews"
                    className="flex items-center gap-2 rounded-lg border border-slate-200/70 px-3 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                    onClick={onClose}
                  >
                    <AppIcon icon={Calendar} size="xs" />
                    View Interview
                  </Link>
                </>
              ) : (
                <Link
                  href="/dashboard/company/hiring/applicants"
                  className="flex items-center gap-2 rounded-lg border border-slate-200/70 px-3 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                  onClick={onClose}
                >
                  <AppIcon icon={UserRound} size="xs" />
                  View applicants
                </Link>
              )}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
