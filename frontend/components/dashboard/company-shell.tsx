"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { AnimatedBackground } from "@/components/dashboard/AnimatedBackground";
import { cn } from "@/lib/utils";

type SidebarItem = {
  label: string;
  href: string;
  icon: React.ReactNode;
};

type SidebarSection = {
  title: string;
  items: SidebarItem[];
};

type CompanyShellProps = {
  welcomeName?: string;
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

function IconEdit() {
  return (
    <BaseIcon>
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M4 20h4l10-10-4-4L4 16z" />
        <path d="M13 7l4 4" />
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

function IconPlusFile() {
  return (
    <BaseIcon>
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M7 3h7l4 4v14H7z" />
        <path d="M14 3v4h4" />
        <path d="M12 11v6M9 14h6" />
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

function IconPipeline() {
  return (
    <BaseIcon>
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="5" cy="6" r="2" />
        <circle cx="12" cy="12" r="2" />
        <circle cx="19" cy="18" r="2" />
        <path d="M6.6 7.4l3.8 3.2M13.6 13.4l3.8 3.2" />
      </svg>
    </BaseIcon>
  );
}

function IconSpark() {
  return (
    <BaseIcon>
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M12 3l1.8 4.2L18 9l-4.2 1.8L12 15l-1.8-4.2L6 9l4.2-1.8z" />
      </svg>
    </BaseIcon>
  );
}

function IconSearch() {
  return (
    <BaseIcon>
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="11" cy="11" r="6" />
        <path d="M20 20l-3.2-3.2" />
      </svg>
    </BaseIcon>
  );
}

function IconBookmark() {
  return (
    <BaseIcon>
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M7 4h10v16l-5-3-5 3z" />
      </svg>
    </BaseIcon>
  );
}

function IconMessage() {
  return (
    <BaseIcon>
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M20 15a3 3 0 0 1-3 3H9l-5 3V6a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3z" />
      </svg>
    </BaseIcon>
  );
}

function IconClipboard() {
  return (
    <BaseIcon>
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="6" y="4" width="12" height="16" rx="2" />
        <path d="M9 4.5h6v3H9z" />
      </svg>
    </BaseIcon>
  );
}

function IconDownload() {
  return (
    <BaseIcon>
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M12 3v12" />
        <path d="M8.5 11.5L12 15l3.5-3.5" />
        <path d="M4 20h16" />
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

function buildSections(): SidebarSection[] {
  return [
    {
      title: "Main",
      items: [{ label: "Dashboard Overview", href: "/dashboard/company", icon: <IconGrid /> }]
    },
    {
      title: "Company Profile",
      items: [
        { label: "Company Profile", href: "/dashboard/company/profile", icon: <IconOffice /> },
        { label: "Edit Company Profile", href: "/dashboard/company/profile/edit", icon: <IconEdit /> },
        { label: "Verification Status", href: "/dashboard/company/profile/verification", icon: <IconShield /> }
      ]
    },
    {
      title: "Hiring",
      items: [
        { label: "Post Internship", href: "/dashboard/company/hiring/post", icon: <IconPlusFile /> },
        { label: "Active Internships", href: "/dashboard/company/hiring/active", icon: <IconList /> },
        { label: "Applicants", href: "/dashboard/company/hiring/applicants", icon: <IconUsers /> },
        { label: "Shortlisted", href: "/dashboard/company/hiring/shortlisted", icon: <IconUsers /> },
        { label: "Hiring Pipeline", href: "/dashboard/company/hiring/pipeline", icon: <IconPipeline /> }
      ]
    },
    {
      title: "Matching",
      items: [
        { label: "AI Matched Candidates", href: "/dashboard/company/matching/ai", icon: <IconSpark /> },
        { label: "Candidate Search", href: "/dashboard/company/matching/search", icon: <IconSearch /> },
        { label: "Saved Candidates", href: "/dashboard/company/matching/saved", icon: <IconBookmark /> }
      ]
    },
    {
      title: "Feedback & Reports",
      items: [
        { label: "Feedback", href: "/dashboard/company/reports/feedback", icon: <IconMessage /> },
        { label: "Hiring Notes", href: "/dashboard/company/reports/notes", icon: <IconClipboard /> },
        { label: "Reports / Export", href: "/dashboard/company/reports/export", icon: <IconDownload /> }
      ]
    }
  ];
}

function isItemActive(pathname: string, href: string) {
  if (href === "/dashboard/company") return pathname === "/dashboard/company";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function CompanyShell({ welcomeName, onLogout, children }: CompanyShellProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const sections = useMemo(() => buildSections(), []);

  return (
    <div className="min-h-screen bg-slate-100/70 transition-colors dark:bg-slate-950/60">
      <div className="mx-auto flex max-w-[1600px]">
        <aside
          className={cn(
            "sidebar-surface fixed inset-y-0 left-0 z-40 w-72 p-5 shadow-[0_12px_36px_rgba(15,23,42,0.12)] transition-transform duration-300 lg:static lg:translate-x-0 dark:shadow-[0_16px_44px_rgba(2,6,23,0.55)]",
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <div className="mb-6 rounded-2xl bg-gradient-to-r from-primary-600 to-blue-600 p-4 text-white shadow-glow dark:from-primary-700 dark:to-cyan-600">
            <p className="text-xs uppercase tracking-[0.18em] text-primary-100">Company Portal</p>
            <h2 className="mt-2 text-xl font-black tracking-tight">Hiring Command Center</h2>
          </div>

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
                            "flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                            active
                              ? "bg-primary-50 text-primary-700 shadow-[0_4px_14px_rgba(37,99,235,0.12)] dark:bg-primary-900/20 dark:text-primary-300"
                              : "text-slate-600 hover:bg-white hover:text-slate-900 hover:shadow-[0_4px_14px_rgba(15,23,42,0.08)] dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
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
          <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/82 px-4 py-3.5 backdrop-blur-xl lg:px-6 dark:border-slate-800 dark:bg-slate-950/78">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setMobileOpen(true)}
                  className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-slate-600 transition hover:bg-slate-50 lg:hidden dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  <IconMenu />
                </button>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary-600 dark:text-primary-300">Welcome</p>
                  <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">{welcomeName || "Company"}</h1>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button type="button" className="rounded-xl border border-slate-200 bg-white p-2 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800">
                  <IconBell />
                </button>
                <Button href="/auth/company" type="button" variant="secondary" size="sm">
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





