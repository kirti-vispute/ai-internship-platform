"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
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

type InternShellProps = {
  welcomeName?: string;
  onLogout: () => void;
  children: React.ReactNode;
};

function BaseIcon({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex h-5 w-5 items-center justify-center text-slate-500" aria-hidden="true">
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

function IconUser() {
  return (
    <BaseIcon>
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="8" r="3.2" />
        <path d="M5 19c1.4-3.1 4.1-4.7 7-4.7s5.6 1.6 7 4.7" />
      </svg>
    </BaseIcon>
  );
}

function IconFile() {
  return (
    <BaseIcon>
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M7 3h7l4 4v14H7z" />
        <path d="M14 3v4h4" />
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

function IconChart() {
  return (
    <BaseIcon>
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M4 19h16" />
        <path d="M7 16V9" />
        <path d="M12 16V5" />
        <path d="M17 16v-7" />
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

function IconBook() {
  return (
    <BaseIcon>
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M5 4h10a3 3 0 0 1 3 3v13H8a3 3 0 0 0-3 3z" />
        <path d="M5 4v16a3 3 0 0 1 3-3h10" />
      </svg>
    </BaseIcon>
  );
}

function IconBadge() {
  return (
    <BaseIcon>
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="10" r="4" />
        <path d="M9 14l-1 6 4-2 4 2-1-6" />
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

function IconMessage() {
  return (
    <BaseIcon>
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M20 15a3 3 0 0 1-3 3H9l-5 3V6a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3z" />
      </svg>
    </BaseIcon>
  );
}

function IconLightbulb() {
  return (
    <BaseIcon>
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M9 18h6" />
        <path d="M10 22h4" />
        <path d="M8.3 14.5A6.2 6.2 0 1 1 15.7 14.5c-.8.8-1.2 1.6-1.3 2.5h-2.8c-.1-.9-.5-1.7-1.3-2.5z" />
      </svg>
    </BaseIcon>
  );
}

function IconHelp() {
  return (
    <BaseIcon>
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="12" r="9" />
        <path d="M9.5 9.5a2.5 2.5 0 1 1 4.2 1.8c-.8.7-1.7 1.2-1.7 2.7" />
        <circle cx="12" cy="17.2" r=".8" fill="currentColor" stroke="none" />
      </svg>
    </BaseIcon>
  );
}
function IconBell() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 text-slate-600" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2a2 2 0 0 1-.6 1.4L4 17h5m6 0a3 3 0 1 1-6 0" />
    </svg>
  );
}

function buildSections(): SidebarSection[] {
  return [
    {
      title: "Main",
      items: [{ label: "Dashboard Overview", href: "/dashboard/intern", icon: <IconGrid /> }]
    },
    {
      title: "My Profile",
      items: [
        { label: "Profile", href: "/dashboard/intern/profile", icon: <IconUser /> },
        { label: "Edit Profile", href: "/dashboard/intern/profile/edit", icon: <IconUser /> },
        { label: "Resume", href: "/dashboard/intern/resume", icon: <IconFile /> },
        { label: "Resume Score", href: "/dashboard/intern/resume/score", icon: <IconSpark /> },
        { label: "Skill Gap Analysis", href: "/dashboard/intern/skill-gap", icon: <IconChart /> }
      ]
    },
    {
      title: "Internships",
      items: [
        { label: "Recommended Internships", href: "/dashboard/intern/internships/recommended", icon: <IconSpark /> },
        { label: "Search Internships", href: "/dashboard/intern/internships/search", icon: <IconSearch /> },
        { label: "Saved Internships", href: "/dashboard/intern/internships/saved", icon: <IconBookmark /> },
        { label: "My Applications", href: "/dashboard/intern/applications", icon: <IconList /> },
        { label: "Track Progress", href: "/dashboard/intern/track-progress", icon: <IconChart /> }
      ]
    },
    {
      title: "Learning",
      items: [
        { label: "Courses", href: "/dashboard/intern/learning/courses", icon: <IconBook /> },
        { label: "Certifications", href: "/dashboard/intern/learning/certifications", icon: <IconBadge /> },
        { label: "Mock Aptitude Test", href: "/dashboard/intern/learning/mock-aptitude", icon: <IconClipboard /> },
        { label: "Mock Technical Test", href: "/dashboard/intern/learning/mock-technical", icon: <IconClipboard /> },
        { label: "Mock Interview", href: "/dashboard/intern/learning/mock-interview", icon: <IconMessage /> }
      ]
    },
    {
      title: "Feedback & Support",
      items: [
        { label: "HR Feedback", href: "/dashboard/intern/feedback/hr", icon: <IconMessage /> },
        { label: "Suggestions", href: "/dashboard/intern/feedback/suggestions", icon: <IconLightbulb /> },
        { label: "Help / Support", href: "/dashboard/intern/support", icon: <IconHelp /> }
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
  const sections = useMemo(() => buildSections(), []);

  return (
    <div className="min-h-screen bg-slate-100/80">
      <div className="mx-auto flex max-w-[1600px]">
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-40 w-72 border-r border-slate-200 bg-white p-4 shadow-soft transition-transform lg:static lg:translate-x-0",
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <div className="mb-6 rounded-2xl bg-gradient-to-r from-primary-600 to-blue-600 p-4 text-white">
            <p className="text-xs uppercase tracking-[0.18em] text-primary-100">Intern Portal</p>
            <h2 className="mt-2 text-xl font-black tracking-tight">AI Internship Platform</h2>
          </div>

          <nav className="space-y-4">
            {sections.map((section) => (
              <div key={section.title}>
                <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">{section.title}</p>
                <ul className="mt-2 space-y-1">
                  {section.items.map((item) => {
                    const active = isItemActive(pathname, item.href);
                    return (
                      <li key={item.label}>
                        <Link
                          href={item.href}
                          onClick={() => setMobileOpen(false)}
                          className={cn(
                            "flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition",
                            active ? "bg-primary-50 text-primary-700" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
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

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur lg:px-6">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setMobileOpen(true)}
                  className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-slate-600 lg:hidden"
                >
                  ☰
                </button>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary-600">Welcome</p>
                  <h1 className="text-lg font-bold text-slate-900">{welcomeName || "Intern"}</h1>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button type="button" className="rounded-xl border border-slate-200 bg-white p-2">
                  <IconBell />
                </button>
                <Button href="/auth?role=intern" type="button" variant="secondary" size="sm">
                  Switch Account
                </Button>
                <Button type="button" variant="secondary" size="sm" onClick={onLogout}>
                  Logout
                </Button>
              </div>
            </div>
          </header>

          <main className="p-4 lg:p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
