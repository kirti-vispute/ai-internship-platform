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

function IconDashboard() {
  return <span className="text-base">📊</span>;
}
function IconProfile() {
  return <span className="text-base">👤</span>;
}
function IconResume() {
  return <span className="text-base">📄</span>;
}
function IconScore() {
  return <span className="text-base">🎯</span>;
}
function IconSkills() {
  return <span className="text-base">🧠</span>;
}
function IconInternship() {
  return <span className="text-base">💼</span>;
}
function IconSearch() {
  return <span className="text-base">🔎</span>;
}
function IconSaved() {
  return <span className="text-base">⭐</span>;
}
function IconApps() {
  return <span className="text-base">🗂️</span>;
}
function IconTrack() {
  return <span className="text-base">📈</span>;
}
function IconCourse() {
  return <span className="text-base">📚</span>;
}
function IconCert() {
  return <span className="text-base">🏅</span>;
}
function IconTest() {
  return <span className="text-base">📝</span>;
}
function IconInterview() {
  return <span className="text-base">🎤</span>;
}
function IconFeedback() {
  return <span className="text-base">💬</span>;
}
function IconSuggest() {
  return <span className="text-base">💡</span>;
}
function IconHelp() {
  return <span className="text-base">🛟</span>;
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
      items: [{ label: "Dashboard Overview", href: "/dashboard/intern", icon: <IconDashboard /> }]
    },
    {
      title: "My Profile",
      items: [
        { label: "Profile", href: "/dashboard/intern#profile", icon: <IconProfile /> },
        { label: "Edit Profile", href: "/dashboard/intern#edit-profile", icon: <IconProfile /> },
        { label: "Resume", href: "/dashboard/intern#resume", icon: <IconResume /> },
        { label: "Resume Score", href: "/dashboard/intern#resume-score", icon: <IconScore /> },
        { label: "Skill Gap Analysis", href: "/dashboard/intern#resume-analyzer", icon: <IconSkills /> }
      ]
    },
    {
      title: "Internships",
      items: [
        { label: "Recommended Internships", href: "/dashboard/intern#recommended", icon: <IconInternship /> },
        { label: "Search Internships", href: "/dashboard/intern#search", icon: <IconSearch /> },
        { label: "Saved Internships", href: "/dashboard/intern#saved", icon: <IconSaved /> },
        { label: "My Applications", href: "/dashboard/intern/applications", icon: <IconApps /> },
        { label: "Track Progress", href: "/dashboard/intern#progress", icon: <IconTrack /> }
      ]
    },
    {
      title: "Learning",
      items: [
        { label: "Courses", href: "/dashboard/intern#courses", icon: <IconCourse /> },
        { label: "Certifications", href: "/dashboard/intern#certifications", icon: <IconCert /> },
        { label: "Mock Aptitude Test", href: "/dashboard/intern#mock-aptitude", icon: <IconTest /> },
        { label: "Mock Technical Test", href: "/dashboard/intern#mock-technical", icon: <IconTest /> },
        { label: "Mock Interview", href: "/dashboard/intern#mock-interview", icon: <IconInterview /> }
      ]
    },
    {
      title: "Feedback & Support",
      items: [
        { label: "HR Feedback", href: "/dashboard/intern#feedback", icon: <IconFeedback /> },
        { label: "Suggestions", href: "/dashboard/intern#suggestions", icon: <IconSuggest /> },
        { label: "Help / Support", href: "/dashboard/intern#support", icon: <IconHelp /> }
      ]
    }
  ];
}

function isItemActive(pathname: string, href: string) {
  const baseHref = href.split("#")[0];
  if (baseHref === "/dashboard/intern" && pathname === "/dashboard/intern") return true;
  return pathname === baseHref;
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
