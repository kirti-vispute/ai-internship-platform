"use client";

import Link from "next/link";
import { Bell, LogOut, Menu, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppIcon } from "@/components/icons/app-icon";

type DashboardShellHeaderProps = {
  welcomeLabel?: string;
  welcomeTagline?: string;
  welcomeName?: string;
  meta?: string;
  onOpenMenu: () => void;
  onLogout: () => void;
  switchHref: string;
  switchLabel?: string;
  notificationHref?: string;
  messageUnreadCount?: number;
};

export function DashboardShellHeader({
  welcomeLabel = "Welcome",
  welcomeTagline,
  welcomeName,
  meta,
  onOpenMenu,
  onLogout,
  switchHref,
  switchLabel = "Switch Account",
  notificationHref,
  messageUnreadCount = 0
}: DashboardShellHeaderProps) {
  const badgeCount = messageUnreadCount > 0 ? (messageUnreadCount > 9 ? "9+" : messageUnreadCount) : null;

  const bellButton = notificationHref ? (
    <Link
      href={notificationHref}
      className="relative rounded-xl border border-slate-200 bg-white p-2 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
      aria-label={badgeCount ? `${badgeCount} unread messages` : "Notifications"}
    >
      <AppIcon icon={Bell} size="md" className="text-slate-600 dark:text-slate-300" />
      {badgeCount ? (
        <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary-600 px-1 text-[10px] font-bold text-white">
          {badgeCount}
        </span>
      ) : null}
    </Link>
  ) : (
    <button
      type="button"
      className="relative rounded-xl border border-slate-200 bg-white p-2 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
      aria-label="Notifications"
    >
      <AppIcon icon={Bell} size="md" className="text-slate-600 dark:text-slate-300" />
      {badgeCount ? (
        <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary-600 px-1 text-[10px] font-bold text-white">
          {badgeCount}
        </span>
      ) : null}
    </button>
  );

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/82 px-4 py-3.5 backdrop-blur-xl lg:px-6 dark:border-slate-800 dark:bg-slate-950/78">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <button
            type="button"
            onClick={onOpenMenu}
            className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-slate-600 transition hover:bg-slate-50 lg:hidden dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
            aria-label="Open menu"
          >
            <AppIcon icon={Menu} size="md" />
          </button>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary-600 dark:text-primary-300">{welcomeLabel}</p>
            <h1 className="truncate text-base font-bold leading-snug text-slate-900 sm:text-lg dark:text-slate-100">
              {welcomeTagline || welcomeName || "User"}
            </h1>
            {welcomeTagline && welcomeName ? (
              <p className="truncate text-sm text-slate-600 dark:text-slate-300">Hi, {welcomeName}</p>
            ) : null}
            {meta && <p className="truncate text-xs capitalize text-slate-500 dark:text-slate-400">{meta}</p>}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          {bellButton}
          <Button href={switchHref} type="button" variant="secondary" size="sm">
            <AppIcon icon={RefreshCw} size="xs" className="text-current" />
            <span className="hidden sm:inline">{switchLabel}</span>
            <span className="sm:hidden">Switch</span>
          </Button>
          <Button type="button" variant="secondary" size="sm" onClick={onLogout}>
            <AppIcon icon={LogOut} size="xs" className="text-current" />
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
}
