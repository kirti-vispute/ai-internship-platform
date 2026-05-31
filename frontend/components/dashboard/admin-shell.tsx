"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { AnimatedBackground } from "@/components/dashboard/AnimatedBackground";
import { ADMIN_PERMISSIONS, hasAdminPermission } from "@/constants/admin-permissions";
import { cn } from "@/lib/utils";
import type { AdminRole } from "@/lib/session";

type SidebarItem = {
  label: string;
  href: string;
  icon: React.ReactNode;
  permission?: string;
};

type SidebarSection = {
  title: string;
  items: SidebarItem[];
};

type AdminShellProps = {
  welcomeName?: string;
  adminRole?: AdminRole | null;
  permissions?: string[];
  onLogout: () => void;
  children: React.ReactNode;
};

function BaseIcon({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex h-5 w-5 items-center justify-center text-slate-500 transition-colors dark:text-slate-400" aria-hidden="true">
      {children}
    </span>
  );
}

function IconGrid() {
  return (
    <BaseIcon>
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="4" y="4" width="7" height="7" rx="1.5" />
        <rect x="13" y="4" width="7" height="7" rx="1.5" />
        <rect x="4" y="13" width="7" height="7" rx="1.5" />
        <rect x="13" y="13" width="7" height="7" rx="1.5" />
      </svg>
    </BaseIcon>
  );
}

function IconUsers() {
  return (
    <BaseIcon>
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M16 20v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
        <circle cx="9.5" cy="8" r="3" />
        <path d="M22 20v-2a4 4 0 0 0-3-3.9" />
        <path d="M16.5 5.2a3 3 0 0 1 0 5.6" />
      </svg>
    </BaseIcon>
  );
}

function IconOffice() {
  return (
    <BaseIcon>
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M4 20V7l8-3 8 3v13" />
        <path d="M9 20v-4h6v4" />
        <path d="M8 10h.01M12 10h.01M16 10h.01M8 13h.01M12 13h.01M16 13h.01" strokeLinecap="round" />
      </svg>
    </BaseIcon>
  );
}

function IconShield() {
  return (
    <BaseIcon>
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M12 3l8 3v6c0 5.5-3.4 8.5-8 10-4.6-1.5-8-4.5-8-10V6z" />
        <path d="M9.3 12.3l2.1 2.1 3.4-3.7" />
      </svg>
    </BaseIcon>
  );
}

function IconList() {
  return (
    <BaseIcon>
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M9 7h10M9 12h10M9 17h10" />
        <circle cx="5" cy="7" r="1" />
        <circle cx="5" cy="12" r="1" />
        <circle cx="5" cy="17" r="1" />
      </svg>
    </BaseIcon>
  );
}

function IconFlag() {
  return (
    <BaseIcon>
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M5 21V4" />
        <path d="M5 4h11l-2 4 2 4H5" />
      </svg>
    </BaseIcon>
  );
}

function IconActivity() {
  return (
    <BaseIcon>
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M3 12h4l3 8 4-16 3 8h4" />
      </svg>
    </BaseIcon>
  );
}

function IconBell() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 text-slate-600 dark:text-slate-300" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2a2 2 0 0 1-.6 1.4L4 17h5m6 0a3 3 0 1 1-6 0" />
    </svg>
  );
}

function IconMenu() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

function buildSections(permissions: string[]): SidebarSection[] {
  const can = (perm: string) => hasAdminPermission(permissions, perm as (typeof ADMIN_PERMISSIONS)[keyof typeof ADMIN_PERMISSIONS]);

  const sections: SidebarSection[] = [
    {
      title: "Main",
      items: [{ label: "Dashboard Overview", href: "/dashboard/admin", icon: <IconGrid /> }]
    },
    {
      title: "Management",
      items: [
        ...(can(ADMIN_PERMISSIONS.USER_VIEW)
          ? [{ label: "Users", href: "/dashboard/admin/users", icon: <IconUsers />, permission: ADMIN_PERMISSIONS.USER_VIEW }]
          : []),
        ...(can(ADMIN_PERMISSIONS.COMPANY_VERIFY)
          ? [
              { label: "Companies", href: "/dashboard/admin/companies", icon: <IconOffice />, permission: ADMIN_PERMISSIONS.COMPANY_VERIFY },
              { label: "Verification Queue", href: "/dashboard/admin/verification", icon: <IconShield />, permission: ADMIN_PERMISSIONS.COMPANY_VERIFY }
            ]
          : []),
        { label: "Internships", href: "/dashboard/admin/internships", icon: <IconList /> }
      ]
    },
    {
      title: "Moderation",
      items: [
        ...(can(ADMIN_PERMISSIONS.REPORT_REVIEW)
          ? [{ label: "Reported Companies", href: "/dashboard/admin/reports", icon: <IconFlag />, permission: ADMIN_PERMISSIONS.REPORT_REVIEW }]
          : []),
        ...(can(ADMIN_PERMISSIONS.ACTIVITY_VIEW)
          ? [{ label: "Activity Logs", href: "/dashboard/admin/activity-logs", icon: <IconActivity />, permission: ADMIN_PERMISSIONS.ACTIVITY_VIEW }]
          : [])
      ]
    },
    {
      title: "Secondary",
      items: [
        { label: "Analytics", href: "/dashboard/admin/analytics", icon: <IconGrid /> },
        { label: "Notifications", href: "/dashboard/admin/notifications", icon: <IconBell /> },
        { label: "Settings", href: "/dashboard/admin/settings", icon: <IconShield /> }
      ]
    }
  ];

  return sections.filter((section) => section.items.length > 0);
}

function isItemActive(pathname: string, href: string) {
  if (href === "/dashboard/admin") return pathname === "/dashboard/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminShell({ welcomeName, adminRole, permissions = [], onLogout, children }: AdminShellProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const sections = useMemo(() => buildSections(permissions), [permissions]);
  const roleLabel = adminRole ? adminRole.replace(/_/g, " ") : "administrator";

  return (
    <div className="min-h-screen bg-slate-100/70 transition-colors dark:bg-slate-950/60">
      <div className="mx-auto flex max-w-[1600px]">
        <aside
          className={cn(
            "sidebar-surface fixed inset-y-0 left-0 z-40 flex h-screen w-72 flex-col overflow-hidden p-5 shadow-[0_12px_36px_rgba(15,23,42,0.12)] transition-transform duration-300 lg:static lg:translate-x-0 dark:shadow-[0_16px_44px_rgba(2,6,23,0.55)]",
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <div className="mb-6 rounded-2xl bg-gradient-to-r from-primary-600 to-blue-600 p-4 text-white shadow-glow dark:from-primary-700 dark:to-cyan-600">
            <p className="text-xs uppercase tracking-[0.18em] text-primary-100">Admin Portal</p>
            <h2 className="mt-2 text-xl font-black tracking-tight">Control Center</h2>
          </div>

          <nav className="scrollbar-dark min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain pr-1">
            {sections.map((section) => (
              <div key={section.title} className="animate-reveal">
                <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">{section.title}</p>
                <ul className="mt-2.5 space-y-1.5">
                  {section.items.map((item) => {
                    const active = isItemActive(pathname, item.href);
                    return (
                      <li key={item.label}>
                        <Link
                          href={item.href}
                          onClick={() => setMobileOpen(false)}
                          className={cn(
                            "flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                            active
                              ? "bg-primary-50 text-primary-700 shadow-[0_4px_14px_rgba(37,99,235,0.12)] dark:bg-primary-900/20 dark:text-primary-300"
                              : "text-slate-600 hover:bg-slate-800 hover:text-white hover:shadow-[0_4px_14px_rgba(15,23,42,0.08)] dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                          )}
                        >
                          {item.icon}
                          <span>{item.label}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>
        </aside>

        {mobileOpen && <button aria-label="Close menu" className="fixed inset-0 z-30 bg-slate-900/40 lg:hidden" onClick={() => setMobileOpen(false)} />}

        <div className="relative min-w-0 flex-1 overflow-hidden">
          <AnimatedBackground className="opacity-75" />
          <header className="sticky top-0 z-20 border-b border-slate-800/80 bg-slate-950/82 px-4 py-3.5 backdrop-blur-xl lg:px-6 dark:border-slate-800 dark:bg-slate-950/78">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setMobileOpen(true)}
                  className="rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-slate-600 transition hover:bg-slate-800 lg:hidden dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  <IconMenu />
                </button>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary-600 dark:text-primary-300">Signed in as</p>
                  <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">{welcomeName || "Administrator"}</h1>
                  <p className="text-xs capitalize text-slate-500 dark:text-slate-400">{roleLabel}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href="/dashboard/admin/notifications"
                  className="rounded-xl border border-slate-700 bg-slate-900 p-2 transition hover:bg-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
                  aria-label="Notifications"
                >
                  <IconBell />
                </Link>
                <Button href="/auth/admin" type="button" variant="secondary" size="sm">
                  Switch Account
                </Button>
                <Button type="button" variant="secondary" size="sm" onClick={onLogout}>
                  Logout
                </Button>
              </div>
            </div>
          </header>

          <main className="animate-reveal relative z-10 mx-auto w-full max-w-[1240px] p-4 lg:p-5">{children}</main>
        </div>
      </div>
    </div>
  );
}
