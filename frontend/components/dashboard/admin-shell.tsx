"use client";

import { useMemo, useState } from "react";
import {
  Activity,
  Award,
  BarChart3,
  Bell,
  Building2,
  ClipboardList,
  Flag,
  LayoutGrid,
  Settings,
  ShieldCheck,
  Users
} from "lucide-react";
import { AnimatedBackground } from "@/components/dashboard/AnimatedBackground";
import { PortalBrandHeader } from "@/components/brand/portal-brand-header";
import { DashboardShellHeader } from "@/components/dashboard/dashboard-shell-header";
import { DashboardSidebarNav } from "@/components/dashboard/dashboard-sidebar-nav";
import { ROLE_WELCOME_LABEL, ROLE_WELCOME_TAGLINE } from "@/lib/auth-routes";
import { AppIcon } from "@/components/icons/app-icon";
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

function buildSections(permissions: string[]): SidebarSection[] {
  const can = (perm: string) => hasAdminPermission(permissions, perm as (typeof ADMIN_PERMISSIONS)[keyof typeof ADMIN_PERMISSIONS]);

  const sections: SidebarSection[] = [
    {
      title: "Main",
      items: [{ label: "Dashboard Overview", href: "/dashboard/admin", icon: <AppIcon icon={LayoutGrid} /> }]
    },
    {
      title: "Management",
      items: [
        ...(can(ADMIN_PERMISSIONS.USER_VIEW)
          ? [{ label: "Users", href: "/dashboard/admin/users", icon: <AppIcon icon={Users} />, permission: ADMIN_PERMISSIONS.USER_VIEW }]
          : []),
        ...(can(ADMIN_PERMISSIONS.COMPANY_VERIFY)
          ? [
              { label: "Companies", href: "/dashboard/admin/companies", icon: <AppIcon icon={Building2} />, permission: ADMIN_PERMISSIONS.COMPANY_VERIFY },
              {
                label: "Verification Queue",
                href: "/dashboard/admin/verification",
                icon: <AppIcon icon={ShieldCheck} />,
                permission: ADMIN_PERMISSIONS.COMPANY_VERIFY
              }
            ]
          : []),
        { label: "Internships", href: "/dashboard/admin/internships", icon: <AppIcon icon={ClipboardList} /> },
        ...(can(ADMIN_PERMISSIONS.CERTIFICATION_REVIEW)
          ? [{
              label: "Certification Review",
              href: "/dashboard/admin/certification-review",
              icon: <AppIcon icon={Award} />,
              permission: ADMIN_PERMISSIONS.CERTIFICATION_REVIEW
            }]
          : [])
      ]
    },
    {
      title: "Moderation",
      items: [
        ...(can(ADMIN_PERMISSIONS.REPORT_REVIEW)
          ? [{ label: "Reported Companies", href: "/dashboard/admin/reports", icon: <AppIcon icon={Flag} />, permission: ADMIN_PERMISSIONS.REPORT_REVIEW }]
          : []),
        ...(can(ADMIN_PERMISSIONS.ACTIVITY_VIEW)
          ? [{ label: "Activity Logs", href: "/dashboard/admin/activity-logs", icon: <AppIcon icon={Activity} />, permission: ADMIN_PERMISSIONS.ACTIVITY_VIEW }]
          : [])
      ]
    },
    {
      title: "Secondary",
      items: [
        { label: "Platform Statistics", href: "/dashboard/admin/analytics", icon: <AppIcon icon={BarChart3} /> },
        { label: "Notifications", href: "/dashboard/admin/notifications", icon: <AppIcon icon={Bell} /> },
        ...(can(ADMIN_PERMISSIONS.MANAGE)
          ? [{ label: "AI Hiring Scoring", href: "/dashboard/admin/hiring-scoring", icon: <AppIcon icon={BarChart3} /> }]
          : []),
        { label: "Settings", href: "/dashboard/admin/settings", icon: <AppIcon icon={Settings} /> }
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
  const [mobileOpen, setMobileOpen] = useState(false);
  const sections = useMemo(() => buildSections(permissions), [permissions]);
  const roleLabel = adminRole ? adminRole.replace(/_/g, " ") : "administrator";

  return (
    <div className="min-h-screen bg-slate-100/70 transition-colors dark:bg-slate-950/60">
      <div className="mx-auto flex max-w-[1600px]">
        <aside
          className={cn(
            "sidebar-surface sidebar-shell fixed inset-y-0 left-0 z-40 w-72 p-5 shadow-[0_12px_36px_rgba(15,23,42,0.12)] transition-transform duration-300 lg:sticky lg:top-0 lg:translate-x-0 dark:shadow-[0_16px_44px_rgba(2,6,23,0.55)]",
            mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          )}
        >
          <div className="shrink-0">
            <PortalBrandHeader portalLabel="Admin Portal" />
          </div>

          <DashboardSidebarNav sections={sections} isItemActive={isItemActive} onNavigate={() => setMobileOpen(false)} />
        </aside>

        {mobileOpen && <button aria-label="Close menu" className="fixed inset-0 z-30 bg-slate-900/40 lg:hidden" onClick={() => setMobileOpen(false)} />}

        <div className="relative min-w-0 flex-1 overflow-hidden">
          <AnimatedBackground className="opacity-75" />
          <DashboardShellHeader
            welcomeLabel={ROLE_WELCOME_LABEL.admin}
            welcomeTagline={ROLE_WELCOME_TAGLINE.admin}
            welcomeName={welcomeName || "Administrator"}
            meta={roleLabel}
            onOpenMenu={() => setMobileOpen(true)}
            onLogout={onLogout}
          />

          <main className="relative z-10 mx-auto w-full max-w-[1240px] p-4 lg:p-5">{children}</main>
        </div>
      </div>
    </div>
  );
}
