"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { isValidElement, memo, useCallback, useEffect, useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { AppIcon } from "@/components/icons/app-icon";
import { warmDashboardRoute } from "@/lib/intern-route-prefetch-scheduler";
import { cn } from "@/lib/utils";

export type DashboardSidebarItem = {
  label: string;
  href: string;
  icon: LucideIcon | React.ReactNode;
  badge?: number;
  navVariant?: "muted";
};

export type DashboardSidebarSection = {
  title: string;
  items: DashboardSidebarItem[];
};

type DashboardSidebarNavProps = {
  sections: DashboardSidebarSection[];
  isItemActive: (pathname: string, href: string) => boolean;
  onNavigate?: () => void;
};

function SidebarIcon({ icon }: { icon: LucideIcon | React.ReactNode }) {
  if (isValidElement(icon)) {
    return icon;
  }
  return <AppIcon icon={icon as LucideIcon} />;
}

function SidebarNavInner({ sections, isItemActive, onNavigate }: DashboardSidebarNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  useEffect(() => {
    setPendingHref(null);
  }, [pathname]);

  const warmRoute = useCallback(
    (href: string, immediate = false) => {
      warmDashboardRoute(router, href, immediate);
    },
    [router]
  );

  return (
    <nav className="sidebar-nav-scroll mt-5 min-h-0 flex-1 space-y-5 pr-1">
      {sections.map((section) => (
        <div key={section.title}>
          <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">
            {section.title}
          </p>
          <ul className="mt-2.5 space-y-1.5">
            {section.items.map((item) => {
              const active = isItemActive(pathname, item.href) || pendingHref === item.href;
              const muted = item.navVariant === "muted";
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    prefetch
                    scroll
                    onMouseEnter={() => warmRoute(item.href)}
                    onFocus={() => warmRoute(item.href)}
                    onPointerDown={() => warmRoute(item.href, true)}
                    onClick={() => {
                      warmRoute(item.href, true);
                      setPendingHref(item.href);
                      onNavigate?.();
                    }}
                    className={cn(
                      "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-100",
                      active
                        ? muted
                          ? "bg-slate-200/90 text-primary-700 shadow-[0_4px_14px_rgba(15,23,42,0.08)] dark:bg-slate-700/70 dark:text-primary-300"
                          : "bg-primary-50 text-primary-700 shadow-[0_4px_14px_rgba(37,99,235,0.12)] dark:bg-primary-900/20 dark:text-primary-300"
                        : muted
                          ? "text-slate-600 hover:bg-slate-200/80 hover:text-slate-900 hover:shadow-[0_4px_14px_rgba(15,23,42,0.06)] dark:text-slate-300 dark:hover:bg-slate-700/60 dark:hover:text-white"
                          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 hover:shadow-[0_4px_14px_rgba(15,23,42,0.08)] dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                    )}
                  >
                    <SidebarIcon icon={item.icon} />
                    <span className="flex-1">{item.label}</span>
                    {item.badge && item.badge > 0 ? (
                      <span className="rounded-full bg-primary-600 px-2 py-0.5 text-[10px] font-bold text-white">
                        {item.badge > 9 ? "9+" : item.badge}
                      </span>
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

export const DashboardSidebarNav = memo(SidebarNavInner);

export function useDashboardSidebarSections(
  buildSections: (chatUnread?: number) => DashboardSidebarSection[],
  chatUnread = 0
) {
  return useMemo(() => buildSections(chatUnread), [buildSections, chatUnread]);
}
