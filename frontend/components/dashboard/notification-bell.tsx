"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { AppIcon } from "@/components/icons/app-icon";
import { Button } from "@/components/ui/button";
import {
  fetchCompanyNotifications,
  type CompanyNotification
} from "@/lib/company-portal";
import {
  fetchInternNotifications,
  type InAppNotification
} from "@/lib/intern-portal";
import { useChatSocket } from "@/lib/use-chat-socket";
import { cn } from "@/lib/utils";

type NotificationPreview = InAppNotification | CompanyNotification;

type NotificationBellProps = {
  role: "intern" | "company";
  href: string;
  unreadCount: number;
  onUnreadCountChange: (count: number) => void;
};

function resolveOpenLink(item: NotificationPreview, role: "intern" | "company") {
  if (item.link) return item.link;
  if (role === "company" && "metadata" in item && item.metadata?.conversationId) {
    return `/dashboard/company/chat?conversation=${item.metadata.conversationId}`;
  }
  return undefined;
}

export function NotificationBell({ role, href, unreadCount, onUnreadCountChange }: NotificationBellProps) {
  const [open, setOpen] = useState(false);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [preview, setPreview] = useState<NotificationPreview[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  const loadPreview = useCallback(
    async (force = false) => {
      setLoadingPreview(true);
      try {
        if (role === "intern") {
          const payload = await fetchInternNotifications(force);
          setPreview(payload.notifications.slice(0, 5));
          onUnreadCountChange(payload.unreadCount);
        } else {
          const payload = await fetchCompanyNotifications(force);
          setPreview(payload.notifications.slice(0, 5));
          onUnreadCountChange(payload.unreadCount);
        }
      } catch {
        setPreview([]);
      } finally {
        setLoadingPreview(false);
      }
    },
    [onUnreadCountChange, role]
  );

  useChatSocket({
    onNotification: () => {
      if (open) void loadPreview(true);
    }
  });

  useEffect(() => {
    if (!open) return;
    void loadPreview(false);
  }, [loadPreview, open]);

  useEffect(() => {
    if (!open) return undefined;
    function onPointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  const badge = unreadCount > 0 ? (unreadCount > 9 ? "9+" : String(unreadCount)) : null;

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="relative rounded-xl border border-slate-200 bg-white p-2 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
        aria-label={badge ? `${unreadCount} unread notifications` : "Notifications"}
        aria-expanded={open}
      >
        <AppIcon icon={Bell} size="md" className="text-slate-600 dark:text-slate-300" />
        {badge ? (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary-600 px-1 text-[10px] font-bold text-white">
            {badge}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 z-50 mt-2 w-[min(92vw,22rem)] rounded-2xl border border-slate-200 bg-white p-3 shadow-xl dark:border-slate-700 dark:bg-slate-900">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Notifications</p>
            <Link
              href={href}
              className="text-xs font-semibold text-primary-600 hover:underline dark:text-primary-300"
              onClick={() => setOpen(false)}
            >
              View all
            </Link>
          </div>

          {loadingPreview && preview.length === 0 ? (
            <p className="px-2 py-3 text-xs text-slate-500 dark:text-slate-400">Loading…</p>
          ) : null}

          {!loadingPreview && preview.length === 0 ? (
            <p className="px-2 py-3 text-xs text-slate-500 dark:text-slate-400">No notifications yet.</p>
          ) : (
            <ul className="max-h-72 space-y-2 overflow-y-auto">
              {preview.map((item) => {
                const itemHref = resolveOpenLink(item, role);
                return (
                  <li
                    key={item._id}
                    className={cn(
                      "rounded-xl border border-slate-100 px-3 py-2 dark:border-slate-800",
                      item.isRead ? "opacity-75" : "bg-primary-50/40 dark:bg-primary-950/20"
                    )}
                  >
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{item.title}</p>
                    {item.message ? (
                      <p className="mt-0.5 line-clamp-2 text-xs text-slate-600 dark:text-slate-400">{item.message}</p>
                    ) : null}
                    {itemHref ? (
                      <Link
                        href={itemHref}
                        className="mt-2 inline-block text-xs font-semibold text-primary-600 hover:underline dark:text-primary-300"
                        onClick={() => setOpen(false)}
                      >
                        Open
                      </Link>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}

          <div className="mt-3 border-t border-slate-100 pt-2 dark:border-slate-800">
            <Button href={href} type="button" size="sm" variant="secondary" className="w-full">
              Open notifications
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
