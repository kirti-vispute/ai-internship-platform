"use client";

import { LogOut, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppIcon } from "@/components/icons/app-icon";
import { NotificationBell } from "@/components/dashboard/notification-bell";
import { cn } from "@/lib/utils";

type DashboardShellHeaderProps = {
  welcomeLabel?: string;
  welcomeTagline?: string;
  welcomeName?: string;
  meta?: string;
  compact?: boolean;
  onOpenMenu: () => void;
  onLogout: () => void;
  notificationHref?: string;
  notificationRole?: "intern" | "company";
  notificationUnreadCount?: number;
  onNotificationUnreadCountChange?: (count: number) => void;
};

export function DashboardShellHeader({
  welcomeLabel = "Welcome",
  welcomeTagline,
  welcomeName,
  meta,
  compact = false,
  onOpenMenu,
  onLogout,
  notificationHref,
  notificationRole = "intern",
  notificationUnreadCount = 0,
  onNotificationUnreadCountChange
}: DashboardShellHeaderProps) {
  const bell =
    notificationHref && onNotificationUnreadCountChange ? (
      <NotificationBell
        role={notificationRole}
        href={notificationHref}
        unreadCount={notificationUnreadCount}
        onUnreadCountChange={onNotificationUnreadCountChange}
      />
    ) : null;

  return (
    <header
      className={cn(
        "sticky top-0 z-20 border-b border-slate-200/80 bg-white/82 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/78",
        compact ? "px-4 py-2.5 lg:px-6" : "px-4 py-3.5 lg:px-6"
      )}
    >
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
          {compact ? null : (
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
          )}
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          {bell}
          <Button type="button" variant="secondary" size="sm" onClick={onLogout}>
            <AppIcon icon={LogOut} size="xs" className="text-current" />
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
}
