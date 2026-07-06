"use client";

import { useMemo, useState } from "react";
import {
  BarChart3,
  Bell,
  Bookmark,
  Building2,
  ClipboardList,
  Download,
  FilePlus2,
  GitBranch,
  LayoutGrid,
  MessageSquare,
  Pencil,
  Search,
  ShieldCheck,
  Sparkles,
  Users
} from "lucide-react";
import { AnimatedBackground } from "@/components/dashboard/AnimatedBackground";
import { PortalBrandHeader } from "@/components/brand/portal-brand-header";
import { DashboardShellHeader } from "@/components/dashboard/dashboard-shell-header";
import { DashboardSidebarNav } from "@/components/dashboard/dashboard-sidebar-nav";
import { ROLE_WELCOME_LABEL, ROLE_WELCOME_TAGLINE } from "@/lib/auth-routes";
import { AppIcon } from "@/components/icons/app-icon";
import { FEATURE_FLAGS } from "@/constants/featureFlags";
import { useMessagingUnread } from "@/lib/use-messaging-unread";
import { useNotificationUnread } from "@/lib/use-notification-unread";
import { cn } from "@/lib/utils";

type SidebarItem = {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: number;
};

type SidebarSection = {
  title: string;
  items: SidebarItem[];
};

type CompanyShellProps = {
  welcomeName?: string;
  companyAccountType?: "owner" | "hr" | "ceo";
  permissions?: string[];
  onLogout: () => void;
  children: React.ReactNode;
};

function buildSections({
  companyAccountType,
  permissions,
  chatUnread = 0
}: {
  companyAccountType?: "owner" | "hr" | "ceo";
  permissions?: string[];
  chatUnread?: number;
}): SidebarSection[] {
  const canManageRecruiters =
    (permissions || []).includes("company:hr:manage") || companyAccountType === "owner" || companyAccountType === "ceo";
  const canViewSalary =
    (permissions || []).includes("company:analytics:salary") || companyAccountType === "owner" || companyAccountType === "ceo";
  const canCreateInternships = companyAccountType !== "hr";

  return [
    {
      title: "Main",
      items: [{ label: "Dashboard Overview", href: "/dashboard/company", icon: <AppIcon icon={LayoutGrid} /> }]
    },
    {
      title: "Company Profile",
      items: [
        { label: "Company Profile", href: "/dashboard/company/profile", icon: <AppIcon icon={Building2} /> },
        { label: "Edit Company Profile", href: "/dashboard/company/profile/edit", icon: <AppIcon icon={Pencil} /> },
        { label: "Verification Status", href: "/dashboard/company/profile/verification", icon: <AppIcon icon={ShieldCheck} /> }
      ]
    },
    {
      title: "Hiring",
      items: [
        ...(canCreateInternships
          ? [{ label: "Post Internship", href: "/dashboard/company/hiring/post", icon: <AppIcon icon={FilePlus2} /> }]
          : []),
        { label: "Active Internships", href: "/dashboard/company/hiring/active", icon: <AppIcon icon={ClipboardList} /> },
        { label: "Applicants", href: "/dashboard/company/hiring/applicants", icon: <AppIcon icon={Users} /> },
        { label: "Shortlisted", href: "/dashboard/company/hiring/shortlisted", icon: <AppIcon icon={Users} /> },
        { label: "Hiring Pipeline", href: "/dashboard/company/hiring/pipeline", icon: <AppIcon icon={GitBranch} /> },
        ...(FEATURE_FLAGS.ENABLE_CHAT
          ? [
              {
                label: chatUnread > 0 ? `Messages (${chatUnread > 9 ? "9+" : chatUnread})` : "Messages",
                href: "/dashboard/company/chat",
                icon: <AppIcon icon={MessageSquare} />
              }
            ]
          : []),
        { label: "Notifications", href: "/dashboard/company/notifications", icon: <AppIcon icon={Bell} /> }
      ]
    },
    {
      title: "Matching",
      items: [
        { label: "AI Matched Candidates", href: "/dashboard/company/matching/ai", icon: <AppIcon icon={Sparkles} /> },
        { label: "Candidate Search", href: "/dashboard/company/matching/search", icon: <AppIcon icon={Search} /> },
        { label: "Saved Candidates", href: "/dashboard/company/matching/saved", icon: <AppIcon icon={Bookmark} /> }
      ]
    },
    {
      title: "Feedback & Reports",
      items: [
        { label: "Feedback", href: "/dashboard/company/reports/feedback", icon: <AppIcon icon={MessageSquare} /> },
        { label: "Hiring Notes", href: "/dashboard/company/reports/notes", icon: <AppIcon icon={ClipboardList} /> },
        { label: "Reports / Export", href: "/dashboard/company/reports/export", icon: <AppIcon icon={Download} /> }
      ]
    },
    {
      title: "Company Admin",
      items: [
        ...(canManageRecruiters
          ? [{ label: "Recruiter Management", href: "/dashboard/company/team/recruiters", icon: <AppIcon icon={Users} /> }]
          : []),
        { label: "Company Analytics", href: "/dashboard/company/analytics/company", icon: <AppIcon icon={BarChart3} /> },
        ...(canViewSalary
          ? [{ label: "Salary Insights", href: "/dashboard/company/analytics/salary", icon: <AppIcon icon={BarChart3} /> }]
          : [])
      ]
    }
  ].filter((section) => section.items.length > 0);
}

function isItemActive(pathname: string, href: string) {
  if (href === "/dashboard/company") return pathname === "/dashboard/company";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function CompanyShell({ welcomeName, companyAccountType, permissions, onLogout, children }: CompanyShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { messageUnread } = useMessagingUnread();
  const { unreadCount: notificationUnread, setUnreadCount: setNotificationUnread } = useNotificationUnread("company");
  const sections = useMemo(() => buildSections({ companyAccountType, permissions, chatUnread: messageUnread }), [companyAccountType, permissions, messageUnread]);

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
            <PortalBrandHeader portalLabel="Company Portal" />
          </div>

          <DashboardSidebarNav sections={sections} isItemActive={isItemActive} onNavigate={() => setMobileOpen(false)} />
        </aside>

        {mobileOpen && <button aria-label="Close menu" className="fixed inset-0 z-30 bg-slate-900/40 lg:hidden" onClick={() => setMobileOpen(false)} />}

        <div className="relative min-w-0 flex-1 overflow-hidden">
          <AnimatedBackground className="opacity-75" />
          <DashboardShellHeader
            welcomeLabel={ROLE_WELCOME_LABEL.company}
            welcomeTagline={ROLE_WELCOME_TAGLINE.company}
            welcomeName={welcomeName || "Company"}
            onOpenMenu={() => setMobileOpen(true)}
            onLogout={onLogout}
            notificationHref="/dashboard/company/notifications"
            notificationRole="company"
            notificationUnreadCount={notificationUnread}
            onNotificationUnreadCountChange={setNotificationUnread}
          />

          <main className="relative z-10 mx-auto w-full max-w-[1240px] p-4 lg:p-5">{children}</main>
        </div>
      </div>
    </div>
  );
}
