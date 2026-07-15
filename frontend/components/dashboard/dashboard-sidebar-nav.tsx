"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cloneElement, isValidElement, memo, useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { ChevronRight, UserCircle2 } from "lucide-react";
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
  collapsible?: boolean;
  /** Icon shown in the collapsible header. Defaults to a user icon (intern profile). */
  collapsibleIcon?: LucideIcon;
};

type DashboardSidebarNavProps = {
  sections: DashboardSidebarSection[];
  isItemActive: (pathname: string, href: string) => boolean;
  onNavigate?: () => void;
};

function SidebarIcon({ icon }: { icon: LucideIcon | React.ReactNode }) {
  if (isValidElement(icon)) {
    const element = icon as React.ReactElement<{ className?: string }>;
    return cloneElement(element, { className: cn(element.props.className, "!text-current") });
  }
  return <AppIcon icon={icon as LucideIcon} className="!text-current" />;
}

function slugifySectionTitle(title: string) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function SidebarSectionItems({
  items,
  pathname,
  pendingHref,
  isItemActive,
  warmRoute,
  onItemClick
}: {
  items: DashboardSidebarItem[];
  pathname: string;
  pendingHref: string | null;
  isItemActive: (pathname: string, href: string) => boolean;
  warmRoute: (href: string, immediate?: boolean) => void;
  onItemClick: (href: string) => void;
}) {
  return (
    <ul className="mt-2.5 space-y-1.5">
      {items.map((item) => {
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
              onClick={() => onItemClick(item.href)}
              className={cn(
                "group relative flex items-center gap-2.5 rounded-xl py-2.5 pl-3.5 pr-3 text-sm font-medium transition-all duration-150 ease-out",
                active
                  ? muted
                    ? "bg-gradient-to-r from-slate-200/90 to-slate-200/40 text-primary-700 shadow-[0_4px_14px_rgba(15,23,42,0.08)] dark:from-slate-700/70 dark:to-slate-700/20 dark:text-primary-300"
                    : "bg-gradient-to-r from-primary-50 to-primary-50/30 text-primary-700 shadow-[0_4px_14px_rgba(37,99,235,0.12)] dark:from-primary-900/30 dark:to-primary-900/5 dark:text-primary-300"
                  : muted
                    ? "text-slate-600 hover:translate-x-0.5 hover:bg-slate-200/80 hover:text-slate-900 hover:shadow-[0_4px_14px_rgba(15,23,42,0.06)] dark:text-slate-300 dark:hover:bg-slate-700/60 dark:hover:text-white"
                    : "text-slate-600 hover:translate-x-0.5 hover:bg-slate-100 hover:text-slate-900 hover:shadow-[0_4px_14px_rgba(15,23,42,0.08)] dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
              )}
            >
              <span
                className={cn(
                  "absolute inset-y-1.5 left-0 w-[3px] rounded-full bg-primary-500 transition-all duration-150 dark:bg-primary-400",
                  active ? "opacity-100" : "opacity-0"
                )}
                aria-hidden
              />
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
  );
}

function CollapsibleSidebarSection({
  section,
  pathname,
  pendingHref,
  isItemActive,
  warmRoute,
  onItemClick
}: {
  section: DashboardSidebarSection;
  pathname: string;
  pendingHref: string | null;
  isItemActive: (pathname: string, href: string) => boolean;
  warmRoute: (href: string, immediate?: boolean) => void;
  onItemClick: (href: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const panelId = `sidebar-section-${slugifySectionTitle(section.title)}`;
  const HeaderIcon = section.collapsibleIcon ?? UserCircle2;

  const toggle = useCallback(() => setOpen((prev) => !prev), []);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLButtonElement>) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        toggle();
      }
    },
    [toggle]
  );

  return (
    <div>
      <button
        type="button"
        onClick={toggle}
        onKeyDown={handleKeyDown}
        aria-expanded={open}
        aria-controls={panelId}
        className="flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-left transition-colors duration-100 hover:bg-slate-100 dark:hover:bg-slate-800"
      >
        <HeaderIcon className="h-3.5 w-3.5 shrink-0 text-slate-400 dark:text-slate-500" aria-hidden="true" />
        <span className="flex-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">
          {section.title}
        </span>
        <motion.span
          animate={{ rotate: open ? 90 : 0 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
          className="flex shrink-0 items-center justify-center text-slate-400 dark:text-slate-500"
        >
          <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            id={panelId}
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <SidebarSectionItems
              items={section.items}
              pathname={pathname}
              pendingHref={pendingHref}
              isItemActive={isItemActive}
              warmRoute={warmRoute}
              onItemClick={onItemClick}
            />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
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

  const onItemClick = useCallback(
    (href: string) => {
      warmRoute(href, true);
      setPendingHref(href);
      onNavigate?.();
    },
    [warmRoute, onNavigate]
  );

  return (
    <nav className="sidebar-nav-scroll mt-5 min-h-0 flex-1 space-y-5 pr-1">
      {sections.map((section) => {
        if (section.collapsible) {
          return (
            <CollapsibleSidebarSection
              key={section.title}
              section={section}
              pathname={pathname}
              pendingHref={pendingHref}
              isItemActive={isItemActive}
              warmRoute={warmRoute}
              onItemClick={onItemClick}
            />
          );
        }

        return (
          <div key={section.title}>
            <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">
              {section.title}
            </p>
            <SidebarSectionItems
              items={section.items}
              pathname={pathname}
              pendingHref={pendingHref}
              isItemActive={isItemActive}
              warmRoute={warmRoute}
              onItemClick={onItemClick}
            />
          </div>
        );
      })}
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
