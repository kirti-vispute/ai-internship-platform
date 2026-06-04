"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import {
  BarChart3,
  Bell,
  BookOpen,
  Bookmark,
  ClipboardList,
  FileText,
  HelpCircle,
  LayoutGrid,
  Lightbulb,
  MessageSquare,
  Search,
  Sparkles,
  User,
  UserPen
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

type InternShellProps = {
  welcomeName?: string;
  onLogout: () => void;
  children: React.ReactNode;
};

function buildSections(chatUnread = 0): SidebarSection[] {
  return [
    {
      title: "Main",
      items: [{ label: "Dashboard Overview", href: "/dashboard/intern", icon: <AppIcon icon={LayoutGrid} /> }]
    },
    {
      title: "My Profile",
      items: [
        { label: "Profile", href: "/dashboard/intern/profile", icon: <AppIcon icon={User} /> },
        { label: "Edit Profile", href: "/dashboard/intern/profile/edit", icon: <AppIcon icon={UserPen} /> },
        { label: "Resume", href: "/dashboard/intern/resume", icon: <AppIcon icon={FileText} /> },
        { label: "Resume Score", href: "/dashboard/intern/resume/score", icon: <AppIcon icon={Sparkles} /> },
        { label: "Skill Gap Analysis", href: "/dashboard/intern/skill-gap", icon: <AppIcon icon={BarChart3} /> }
      ]
    },
    {
      title: "Internships",
      items: [
        { label: "Recommended Internships", href: "/dashboard/intern/internships/recommended", icon: <AppIcon icon={Sparkles} /> },
        { label: "Search Internships", href: "/dashboard/intern/internships/search", icon: <AppIcon icon={Search} /> },
        { label: "Saved Internships", href: "/dashboard/intern/internships/saved", icon: <AppIcon icon={Bookmark} /> },
        { label: "My Applications", href: "/dashboard/intern/applications", icon: <AppIcon icon={ClipboardList} /> },
        { label: "Track Progress", href: "/dashboard/intern/track-progress", icon: <AppIcon icon={BarChart3} /> }
      ]
    },
    {
      title: "Learning",
      items: [
        { label: "Courses", href: "/dashboard/intern/learning/courses", icon: <AppIcon icon={BookOpen} /> },
        { label: "Certifications", href: "/dashboard/intern/learning/certifications", icon: <AppIcon icon={Sparkles} /> },
        { label: "Mock Aptitude Test", href: "/dashboard/intern/learning/mock-aptitude", icon: <AppIcon icon={ClipboardList} /> },
        { label: "Mock Technical Test", href: "/dashboard/intern/learning/mock-technical", icon: <AppIcon icon={ClipboardList} /> },
        { label: "Mock Interview", href: "/dashboard/intern/learning/mock-interview", icon: <AppIcon icon={MessageSquare} /> }
      ]
    },
    {
      title: "Feedback & Support",
      items: [
        { label: "Notifications", href: "/dashboard/intern/notifications", icon: <AppIcon icon={Bell} /> },
        ...(FEATURE_FLAGS.ENABLE_CHAT
          ? [
              {
                label: chatUnread > 0 ? `Messages (${chatUnread > 9 ? "9+" : chatUnread})` : "Messages",
                href: "/dashboard/intern/chat",
                icon: <AppIcon icon={MessageSquare} />
              }
            ]
          : []),
        { label: "HR Feedback", href: "/dashboard/intern/feedback/hr", icon: <AppIcon icon={MessageSquare} /> },
        { label: "Suggestions", href: "/dashboard/intern/feedback/suggestions", icon: <AppIcon icon={Lightbulb} /> },
        { label: "Help / Support", href: "/dashboard/intern/support", icon: <AppIcon icon={HelpCircle} /> }
      ]
    }
  ];
}

function isItemActive(pathname: string, href: string) {
  if (href === "/dashboard/intern") return pathname === "/dashboard/intern";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function InternShell({ welcomeName, onLogout, children }: InternShellProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { messageUnread } = useMessagingUnread();
  const sections = useMemo(() => buildSections(messageUnread), [messageUnread]);

  return (
    <div className="min-h-screen bg-slate-100/70 transition-colors dark:bg-slate-950/60">
      <div className="mx-auto flex max-w-[1600px]">
        <aside
          className={cn(
            "sidebar-surface fixed inset-y-0 left-0 z-40 w-72 p-5 shadow-[0_12px_36px_rgba(15,23,42,0.12)] transition-transform duration-300 lg:static lg:translate-x-0 dark:shadow-[0_16px_44px_rgba(2,6,23,0.55)]",
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <PortalBrandHeader portalLabel="Intern Portal" />

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
            welcomeLabel={ROLE_WELCOME_LABEL.intern}
            welcomeTagline={ROLE_WELCOME_TAGLINE.intern}
            welcomeName={welcomeName || "Intern"}
            onOpenMenu={() => setMobileOpen(true)}
            onLogout={onLogout}
            switchHref="/auth/intern"
            notificationHref="/dashboard/intern/notifications"
            messageUnreadCount={messageUnread}
          />

          <main className="animate-reveal relative z-10 mx-auto w-full max-w-[1240px] p-4 lg:p-5">{children}</main>
        </div>
      </div>
    </div>
  );
}
