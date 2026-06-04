"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RoleDashboardGuard } from "@/components/ui/role-dashboard-guard";
import { InternShell } from "@/components/dashboard/intern-shell";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { BrandedEmptyState } from "@/components/dashboard/empty-state";
import { BRANDED_EMPTY_STATES } from "@/lib/brand";
import { Button } from "@/components/ui/button";
import { clearAuthSession } from "@/lib/session";
import { InAppNotification, InternProfile, fetchInternNotifications, fetchInternProfile, markAllNotificationsRead, markNotificationRead } from "@/lib/intern-portal";
import { useChatSocket } from "@/lib/use-chat-socket";

export default function InternNotificationsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<InternProfile | null>(null);
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load(force = false) {
    try {
      setLoading(true);
      setError(null);
      const [loadedProfile, payload] = await Promise.all([fetchInternProfile(), fetchInternNotifications(force)]);
      setProfile(loadedProfile);
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
    load(true);
  }, []);

  function openLink(item: InAppNotification) {
    if (item.link) return item.link;
    return undefined;
  }

  function handleLogout() {
    clearAuthSession();
    router.push("/auth/intern");
  }

  return (
    <RoleDashboardGuard expectedRole="intern">
      <InternShell welcomeName={profile?.fullName} onLogout={handleLogout}>
        <div className="dashboard-stack">
          <DashboardPageHeader
            eyebrow="Updates"
            title="Notifications"
            subtitle="Application updates, interview reminders, and recruiter feedback alerts."
            actions={
              unreadCount > 0 ? (
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={async () => {
                    await markAllNotificationsRead();
                    await load(true);
                  }}
                >
                  Mark all read
                </Button>
              ) : undefined
            }
          />

          {loading && <div className="surface-muted p-4 text-sm text-slate-700 dark:text-slate-300">Loading notifications...</div>}
          {error && <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">{error}</div>}

          {!loading && !error && notifications.length === 0 && (
            <BrandedEmptyState preset={BRANDED_EMPTY_STATES.notifications} presetKey="notifications" />
          )}

          {!loading && !error && notifications.length > 0 && (
            <ul className="space-y-2">
              {notifications.map((item) => (
                <li
                  key={item._id}
                  className={`surface-subtle flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between ${item.isRead ? "opacity-80" : ""}`}
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{item.title}</p>
                    {item.message && <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">{item.message}</p>}
                    <p className="mt-1 text-[11px] text-slate-500">{item.createdAt ? new Date(item.createdAt).toLocaleString() : ""}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {openLink(item) && (
                      <Button href={openLink(item)!} type="button" size="sm" variant="secondary">
                        Open
                      </Button>
                    )}
                    {!item.isRead && (
                      <Button
                        type="button"
                        size="sm"
                        onClick={async () => {
                          await markNotificationRead(item._id);
                          await load(true);
                        }}
                      >
                        Mark read
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}

          <p className="text-xs text-slate-500 dark:text-slate-400">
            Prefer the full tracker? Visit{" "}
            <Link href="/dashboard/intern/track-progress" className="font-semibold text-primary-600 hover:underline dark:text-primary-300">
              Track Progress
            </Link>
            .
          </p>
        </div>
      </InternShell>
    </RoleDashboardGuard>
  );
}
