"use client";

import { memo, useCallback, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatedBackground } from "@/components/dashboard/AnimatedBackground";
import { PortalBrandHeader } from "@/components/brand/portal-brand-header";
import { DashboardShellHeader } from "@/components/dashboard/dashboard-shell-header";
import { DashboardSidebarNav } from "@/components/dashboard/dashboard-sidebar-nav";
import { ROLE_WELCOME_LABEL, ROLE_WELCOME_TAGLINE } from "@/lib/auth-routes";
import { getInternSidebarSections, isInternSidebarItemActive } from "@/lib/intern-sidebar-config";
import { useMessagingUnread } from "@/lib/use-messaging-unread";
import { useNotificationUnread } from "@/lib/use-notification-unread";
import { cn } from "@/lib/utils";

type InternShellProps = {
  welcomeName?: string;
  onLogout: () => void;
  children: React.ReactNode;
};

const InternShellSidebar = memo(function InternShellSidebar({
  mobileOpen,
  messageUnread,
  onCloseMobile
}: {
  mobileOpen: boolean;
  messageUnread: number;
  onCloseMobile: () => void;
}) {
  const sections = useMemo(() => getInternSidebarSections(messageUnread), [messageUnread]);

  return (
    <>
      <aside
        className={cn(
          "sidebar-surface sidebar-shell fixed inset-y-0 left-0 z-40 w-72 p-5 shadow-[0_12px_36px_rgba(15,23,42,0.12)] transition-transform duration-300 lg:sticky lg:top-0 lg:translate-x-0 dark:shadow-[0_16px_44px_rgba(2,6,23,0.55)]",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="shrink-0">
          <PortalBrandHeader portalLabel="Intern Portal" />
        </div>
        <DashboardSidebarNav
          sections={sections}
          isItemActive={isInternSidebarItemActive}
          onNavigate={onCloseMobile}
        />
      </aside>
      {mobileOpen ? (
        <button
          aria-label="Close menu"
          className="fixed inset-0 z-30 bg-slate-900/40 lg:hidden"
          onClick={onCloseMobile}
        />
      ) : null}
    </>
  );
});

const InternShellHeader = memo(function InternShellHeader({
  welcomeName,
  notificationUnread,
  compact,
  onNotificationUnreadChange,
  onOpenMenu,
  onLogout
}: {
  welcomeName?: string;
  notificationUnread: number;
  compact: boolean;
  onNotificationUnreadChange: (count: number) => void;
  onOpenMenu: () => void;
  onLogout: () => void;
}) {
  return (
    <DashboardShellHeader
      welcomeLabel={ROLE_WELCOME_LABEL.intern}
      welcomeTagline={ROLE_WELCOME_TAGLINE.intern}
      welcomeName={welcomeName || "Intern"}
      compact={compact}
      onOpenMenu={onOpenMenu}
      onLogout={onLogout}
      notificationHref="/dashboard/intern/notifications"
      notificationRole="intern"
      notificationUnreadCount={notificationUnread}
      onNotificationUnreadCountChange={onNotificationUnreadChange}
    />
  );
});

export function InternShell({ welcomeName, onLogout, children }: InternShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { messageUnread } = useMessagingUnread();
  const { unreadCount: notificationUnread, setUnreadCount: setNotificationUnread } = useNotificationUnread("intern");
  const pathname = usePathname();
  const isMessagingRoute = pathname?.startsWith("/dashboard/intern/chat") ?? false;

  const onCloseMobile = useCallback(() => setMobileOpen(false), []);
  const onOpenMenu = useCallback(() => setMobileOpen(true), []);

  return (
    <div className="min-h-screen bg-slate-100/70 transition-colors dark:bg-slate-950/60">
      <div className="mx-auto flex max-w-[1600px]">
        <InternShellSidebar
          mobileOpen={mobileOpen}
          messageUnread={messageUnread}
          onCloseMobile={onCloseMobile}
        />

        <div className="relative min-w-0 flex-1 overflow-hidden">
          <AnimatedBackground className="opacity-75" />
          <InternShellHeader
            welcomeName={welcomeName}
            notificationUnread={notificationUnread}
            compact={isMessagingRoute}
            onNotificationUnreadChange={setNotificationUnread}
            onOpenMenu={onOpenMenu}
            onLogout={onLogout}
          />

          <main
            className={cn(
              "relative z-10 w-full p-4 lg:p-5",
              isMessagingRoute ? "mx-auto max-w-none" : "mx-auto max-w-[1240px]"
            )}
          >
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
