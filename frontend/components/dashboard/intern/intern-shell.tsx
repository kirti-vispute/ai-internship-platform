"use client";

import { memo, useCallback, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatedBackground } from "@/components/dashboard/shared/AnimatedBackground";
import { PortalBrandHeader } from "@/components/brand/portal-brand-header";
import { DashboardShellHeader } from "@/components/dashboard/shared/dashboard-shell-header";
import { DashboardSidebarNav } from "@/components/dashboard/shared/dashboard-sidebar-nav";
import { SidebarCollapseToggle } from "@/components/dashboard/shared/sidebar-collapse-toggle";
import { ROLE_WELCOME_LABEL, ROLE_WELCOME_TAGLINE } from "@/lib/auth-routes";
import { getInternSidebarSections, isInternSidebarItemActive } from "@/lib/intern-sidebar-config";
import { useMessagingUnread } from "@/lib/use-messaging-unread";
import { useNotificationUnread } from "@/lib/use-notification-unread";
import { useIsDesktopViewport, useSidebarCollapsed } from "@/lib/use-sidebar-collapsed";
import { cn } from "@/lib/utils";

type InternShellProps = {
  welcomeName?: string;
  onLogout: () => void;
  children: React.ReactNode;
};

const InternShellSidebar = memo(function InternShellSidebar({
  mobileOpen,
  messageUnread,
  collapsed,
  railCollapsed,
  onToggleCollapsed,
  onCloseMobile
}: {
  mobileOpen: boolean;
  messageUnread: number;
  collapsed: boolean;
  railCollapsed: boolean;
  onToggleCollapsed: () => void;
  onCloseMobile: () => void;
}) {
  const sections = useMemo(() => getInternSidebarSections(messageUnread), [messageUnread]);

  return (
    <>
      <aside
        className={cn(
          "sidebar-surface sidebar-shell fixed inset-y-0 left-0 z-40 w-72 p-5 shadow-[0_12px_36px_rgba(15,23,42,0.12)] transition-[width,transform] duration-300 ease-in-out lg:sticky lg:top-0 lg:translate-x-0 dark:shadow-[0_16px_44px_rgba(2,6,23,0.55)]",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          collapsed ? "lg:w-20 lg:p-3" : "lg:w-72"
        )}
      >
        <div className="shrink-0">
          <PortalBrandHeader portalLabel="Intern Portal" collapsed={railCollapsed} />
          <div className={cn("mb-4 hidden lg:flex", collapsed ? "justify-center" : "justify-start")}>
            <SidebarCollapseToggle collapsed={collapsed} onToggle={onToggleCollapsed} />
          </div>
        </div>
        <DashboardSidebarNav
          sections={sections}
          isItemActive={isInternSidebarItemActive}
          onNavigate={onCloseMobile}
          collapsed={railCollapsed}
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
  const { collapsed, toggle: toggleCollapsed } = useSidebarCollapsed();
  const isDesktop = useIsDesktopViewport();
  const railCollapsed = collapsed && isDesktop;
  const { messageUnread } = useMessagingUnread();
  const { unreadCount: notificationUnread, setUnreadCount: setNotificationUnread } = useNotificationUnread("intern");
  const pathname = usePathname();
  const isMessagingRoute = pathname?.startsWith("/dashboard/intern/chat") ?? false;

  const onCloseMobile = useCallback(() => setMobileOpen(false), []);
  const onOpenMenu = useCallback(() => setMobileOpen(true), []);

  return (
    <div className="min-h-screen bg-[var(--ds-bg)] transition-colors duration-300">
      <div className="mx-auto flex max-w-[1600px]">
        <InternShellSidebar
          mobileOpen={mobileOpen}
          messageUnread={messageUnread}
          collapsed={collapsed}
          railCollapsed={railCollapsed}
          onToggleCollapsed={toggleCollapsed}
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
            id="main-content"
            tabIndex={-1}
            className={cn(
              "relative z-10 w-full p-4 lg:p-5 focus:outline-none",
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
