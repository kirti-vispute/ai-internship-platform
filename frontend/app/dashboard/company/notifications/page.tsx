"use client";

import Link from "next/link";
import { useEffect, useLayoutEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RoleDashboardGuard } from "@/components/ui/role-dashboard-guard";
import { CompanyShell } from "@/components/dashboard/company-shell";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { BrandedEmptyState } from "@/components/dashboard/empty-state";
import { BRANDED_EMPTY_STATES } from "@/lib/brand";
import { Button } from "@/components/ui/button";
import { logoutAuthSession } from "@/lib/api-client";
import {
  type CompanyNotification,
  type CompanyProfile,
  fetchCompanyNotifications,
  fetchCompanyProfile,
  markAllCompanyNotificationsRead,
  markCompanyNotificationRead,
  peekCompanyNotifications
} from "@/lib/company-portal";
import { useChatSocket } from "@/lib/use-chat-socket";
import { shouldBlockPageContent } from "@/lib/instant-load";

export default function CompanyNotificationsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [notifications, setNotifications] = useState<CompanyNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useLayoutEffect(() => {
    const cached = peekCompanyNotifications();
    if (cached) {
      setNotifications(cached.notifications);
      setUnreadCount(cached.unreadCount);
      setLoading(false);
    }
  }, []);

  async function load(force = false) {
    try {
      setError(null);
      if (!peekCompanyNotifications() && !force) setLoading(true);
      const [companyContext, payload] = await Promise.all([
        fetchCompanyProfile(),
        fetchCompanyNotifications(force)
      ]);
      setProfile(companyContext.profile);
      setNotifications(payload.notifications);
      setUnreadCount(payload.unreadCount);
    } catch (err) {
      setError((err as Error).message || "Failed to load notifications.");
    } finally {
      setLoading(false);
    }
  }

  useChatSocket({
    onNotification: () => void load(true)
  });

  useEffect(() => {
    void load(false);
  }, []);

  async function handleMarkRead(notificationId: string) {
    setNotifications((current) =>
      current.map((item) => (item._id === notificationId ? { ...item, isRead: true } : item))
    );
    setUnreadCount((count) => Math.max(0, count - 1));
    try {
      await markCompanyNotificationRead(notificationId);
    } catch (err) {
      await load(true);
      setError((err as Error).message || "Failed to mark notification as read.");
    }
  }

  async function handleMarkAllRead() {
    setNotifications((current) => current.map((item) => ({ ...item, isRead: true })));
    setUnreadCount(0);
    try {
      await markAllCompanyNotificationsRead();
    } catch (err) {
      await load(true);
      setError((err as Error).message || "Failed to mark notifications as read.");
    }
  }

  async function handleLogout() {
    await logoutAuthSession();
    router.push("/auth/company");
  }

  function openLink(item: CompanyNotification) {
    if (item.link) return item.link;
    if (item.metadata?.conversationId) {
      return `/dashboard/company/chat?conversation=${item.metadata.conversationId}`;
    }
    return undefined;
  }

  return (
    <RoleDashboardGuard expectedRole="company">
      <CompanyShell welcomeName={profile?.companyName} onLogout={handleLogout}>
        <div className="dashboard-stack company-dashboard-stack">
          <DashboardPageHeader
            eyebrow="Updates"
            title="Notifications"
            subtitle="Applicant updates, chat messages, and hiring alerts."
            actions={
              unreadCount > 0 ? (
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={handleMarkAllRead}
                >
                  Mark all read
                </Button>
              ) : undefined
            }
          />

          {shouldBlockPageContent(notifications) && loading && (
            <div className="surface-muted p-4 text-sm text-slate-700 dark:text-slate-300">Loading notifications...</div>
          )}
          {error && <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">{error}</div>}

          {!loading && !error && notifications.length === 0 && (
            <BrandedEmptyState preset={BRANDED_EMPTY_STATES.companyNotifications} presetKey="companyNotifications" />
          )}

          {!loading && !error && notifications.length > 0 && (
            <ul className="company-dashboard-list-stack">
              {notifications.map((item) => {
                const href = openLink(item);
                return (
                  <li
                    key={item._id}
                    className={`company-dashboard-item-card flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between ${item.isRead ? "opacity-80" : ""}`}
                  >
                    <div className="min-w-0">
                      <p className="ds-h3">{item.title}</p>
                      {item.message && <p className="ds-caption mt-1">{item.message}</p>}
                      <p className="ds-caption mt-1 opacity-80">{item.createdAt ? new Date(item.createdAt).toLocaleString() : ""}</p>
                    </div>
                    <div className="company-dashboard-actions-row">
                      {href && (
                        <Button href={href} type="button" size="sm" variant="secondary">
                          Open
                        </Button>
                      )}
                      {!item.isRead && (
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => handleMarkRead(item._id)}
                        >
                          Mark read
                        </Button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          <p className="text-xs text-slate-500 dark:text-slate-400">
            View conversations in{" "}
            <Link href="/dashboard/company/chat" className="font-semibold text-primary-600 hover:underline dark:text-primary-300">
              Messages
            </Link>
            .
          </p>
        </div>
      </CompanyShell>
    </RoleDashboardGuard>
  );
}
