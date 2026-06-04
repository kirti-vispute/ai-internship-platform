"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
import { ROLE_WELCOME_LABEL, ROLE_WELCOME_TAGLINE } from "@/lib/auth-routes";
import { AppIcon } from "@/components/icons/app-icon";
import { FEATURE_FLAGS } from "@/constants/featureFlags";
import { useMessagingUnread } from "@/lib/use-messaging-unread";
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
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { messageUnread } = useMessagingUnread();
  const sections = useMemo(() => buildSections({ companyAccountType, permissions, chatUnread: messageUnread }), [companyAccountType, permissions, messageUnread]);

  return (
    <div className="min-h-screen bg-slate-100/70 transition-colors dark:bg-slate-950/60">
      <div className="mx-auto flex max-w-[1600px]">
        <aside
          className={cn(
            "sidebar-surface fixed inset-y-0 left-0 z-40 w-72 p-5 shadow-[0_12px_36px_rgba(15,23,42,0.12)] transition-transform duration-300 lg:static lg:translate-x-0 dark:shadow-[0_16px_44px_rgba(2,6,23,0.55)]",
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <PortalBrandHeader portalLabel="Company Portal" />

          <nav className="space-y-5">
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
                            "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                            active
                              ? "bg-primary-50 text-primary-700 shadow-[0_4px_14px_rgba(37,99,235,0.12)] dark:bg-primary-900/20 dark:text-primary-300"
                              : "text-slate-600 hover:bg-white hover:text-slate-900 hover:shadow-[0_4px_14px_rgba(15,23,42,0.08)] dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                          )}
                        >
                          {item.icon}
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
            switchHref="/auth/company"
            notificationHref="/dashboard/company/notifications"
            messageUnreadCount={messageUnread}
          />

          <main className="animate-reveal relative z-10 mx-auto w-full max-w-[1240px] p-4 lg:p-5">{children}</main>
        </div>
      </div>
    </div>
  );
}
