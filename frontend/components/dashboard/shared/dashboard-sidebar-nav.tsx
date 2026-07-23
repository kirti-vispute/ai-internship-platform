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
              aria-current={active ? "page" : undefined}
              onMouseEnter={() => warmRoute(item.href)}
              onFocus={() => warmRoute(item.href)}
              onPointerDown={() => warmRoute(item.href, true)}
              onClick={() => onItemClick(item.href)}
              className={cn(
                "group relative flex items-center gap-2.5 rounded-xl py-2.5 pl-3.5 pr-3 text-sm font-medium transition-all duration-150 ease-out",
                active
                  ? "bg-[var(--ds-surface-raised)] text-[var(--ds-accent)] shadow-[0_4px_14px_var(--ds-shadow)]"
                  : "text-[var(--ds-muted)] hover:translate-x-0.5 hover:bg-[var(--ds-hover)] hover:text-[var(--ds-text)]",
                muted && "opacity-90"
              )}
            >
              <span
                className={cn(
                  "absolute inset-y-1.5 left-0 w-[3px] rounded-full bg-[var(--ds-primary)] transition-all duration-150",
                  active ? "opacity-100" : "opacity-0"
                )}
                aria-hidden
              />
              <SidebarIcon icon={item.icon} />
              <span className="flex-1">{item.label}</span>
              {item.badge && item.badge > 0 ? (
                <span className="rounded-full bg-[var(--ds-primary)] px-2 py-0.5 text-[10px] font-bold text-[var(--ds-on-primary)]">
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
  const hasActiveChild = useMemo(
    () => section.items.some((item) => isItemActive(pathname, item.href) || pendingHref === item.href),
    [section.items, pathname, pendingHref, isItemActive]
  );
  const [open, setOpen] = useState(hasActiveChild);
  const panelId = `sidebar-section-${slugifySectionTitle(section.title)}`;
  const HeaderIcon = section.collapsibleIcon ?? UserCircle2;

  useEffect(() => {
    if (hasActiveChild) setOpen(true);
  }, [hasActiveChild]);

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
        className={cn(
          "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left transition-colors duration-100 hover:bg-[var(--ds-hover)]",
          hasActiveChild && !open && "bg-[var(--ds-hover)]"
        )}
      >
        <AppIcon icon={HeaderIcon} size="xs" className={hasActiveChild ? "!text-[var(--ds-accent)]" : undefined} />
        <span
          className={cn(
            "flex-1 text-[11px] font-semibold uppercase tracking-[0.14em]",
            hasActiveChild ? "text-[var(--ds-text)]" : "text-[var(--ds-muted)]"
          )}
        >
          {section.title}
        </span>
        {hasActiveChild && !open ? (
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--ds-primary)]" aria-hidden />
        ) : null}
        <motion.span
          animate={{ rotate: open ? 90 : 0 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
          className="flex shrink-0 items-center justify-center"
        >
          <AppIcon icon={ChevronRight} size="xs" />
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
    <nav aria-label="Primary" className="sidebar-nav-scroll mt-4 min-h-0 flex-1 space-y-4 pr-1 pb-3">
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
            <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--ds-muted)]">
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
