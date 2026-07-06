"use client";

import Link from "next/link";
import { Lightbulb } from "lucide-react";
import { AppIcon } from "@/components/icons/app-icon";

type AiCoachPanelProps = {
  title: string;
  message: string;
  actionLabel?: string;
  actionHref?: string;
};

/** Minimal AI guidance — not a second dashboard */
export function AiCoachPanel({ title, message, actionLabel, actionHref }: AiCoachPanelProps) {
  return (
    <section className="portal-coach dark:border-sky-900/40 dark:bg-sky-950/20">
      <div className="flex gap-3">
        <AppIcon icon={Lightbulb} size="sm" className="mt-0.5 shrink-0 text-sky-600 dark:text-sky-400" />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-sky-700 dark:text-sky-400">AI coach</p>
          <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">{title}</p>
          <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{message}</p>
          {actionLabel && actionHref ? (
            <Link
              href={actionHref}
              className="mt-3 inline-block text-sm font-semibold text-sky-700 underline-offset-2 hover:underline dark:text-sky-400"
            >
              {actionLabel}
            </Link>
          ) : null}
        </div>
      </div>
    </section>
  );
}
