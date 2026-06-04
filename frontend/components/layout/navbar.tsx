"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { LayoutDashboard, LogOut, Menu, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { InternAILogo } from "@/components/brand/internai-logo";
import { AppIcon } from "@/components/icons/app-icon";
import { getDashboardPathForRole, getProfilePathForRole } from "@/lib/auth-routes";
import { clearAuthSession } from "@/lib/session";
import { useAuthSession } from "@/lib/use-auth-session";

const PUBLIC_LINKS = [
  { href: "/", label: "Home" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#capabilities", label: "Capabilities" }
] as const;

const GUEST_AUTH_LINKS = [
  { href: "/auth/intern", label: "Intern Login" },
  { href: "/auth/company", label: "Company Login" }
] as const;

type NavbarProps = {
  theme?: "light" | "dark";
};

export function Navbar({ theme = "light" }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { loggedIn, role } = useAuthSession();
  const isDark = theme === "dark";

  const dashboardHref = role ? getDashboardPathForRole(role) : "/";
  const profileHref = role ? getProfilePathForRole(role) : "/";

  const handleLogout = () => {
    clearAuthSession();
    setMobileOpen(false);
    router.push("/");
  };

  const linkClass = (active: boolean) =>
    cn(
      "rounded-full px-3 py-1.5 text-sm font-semibold transition duration-200",
      active
        ? isDark
          ? "bg-internai-blue/15 text-internai-blue"
          : "bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300"
        : isDark
          ? "text-internai-muted hover:bg-white/[0.04] hover:text-internai-text"
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
    );

  const mobileLinkClass = (active: boolean) =>
    cn(
      "block rounded-xl px-3 py-2.5 text-sm font-semibold transition",
      active
        ? isDark
          ? "bg-internai-blue/15 text-internai-blue"
          : "bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300"
        : isDark
          ? "text-internai-muted hover:bg-white/[0.04] hover:text-internai-text"
          : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
    );

  const isHome = pathname === "/";

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b backdrop-blur-xl",
        isDark
          ? "border-[rgba(59,130,246,0.08)] bg-[rgba(10,19,36,0.48)]"
          : "border-slate-200/70 bg-white/80 dark:border-slate-800 dark:bg-slate-950/80"
      )}
    >
      <nav className="container-shell flex h-16 items-center justify-between gap-3">
        <InternAILogo variant="navbar" href="/" />

        <div className="hidden items-center gap-2 md:flex">
          {loggedIn && role ? (
            <>
              <Link href={dashboardHref} className={linkClass(pathname.startsWith(dashboardHref))}>
                <span className="inline-flex items-center gap-1.5">
                  <AppIcon icon={LayoutDashboard} size="xs" />
                  Dashboard
                </span>
              </Link>
              <Link href={profileHref} className={linkClass(pathname.startsWith(profileHref))}>
                <span className="inline-flex items-center gap-1.5">
                  <AppIcon icon={User} size="xs" />
                  Profile
                </span>
              </Link>
              {!isHome &&
                PUBLIC_LINKS.map((link) => (
                  <Link key={link.href} href={link.href} className={linkClass(false)}>
                    {link.label}
                  </Link>
                ))}
            </>
          ) : (
            <>
              {PUBLIC_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={linkClass(link.href === "/" ? pathname === "/" : false)}
                >
                  {link.label}
                </Link>
              ))}
              {GUEST_AUTH_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={linkClass(pathname === link.href || pathname.startsWith(link.href))}
                >
                  {link.label}
                </Link>
              ))}
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          {loggedIn && role ? (
            <button
              type="button"
              onClick={handleLogout}
              className={cn(
                "hidden rounded-full border px-3 py-1.5 text-sm font-semibold transition lg:inline-flex lg:items-center lg:gap-1.5",
                isDark
                  ? "border-white/10 bg-internai-elevated/60 text-internai-text hover:bg-internai-elevated"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              )}
            >
              <AppIcon icon={LogOut} size="xs" />
              Logout
            </button>
          ) : (
            <Link
              href="/auth/intern"
              className={cn(
                "hidden rounded-full px-3 py-1.5 text-sm font-semibold transition lg:inline-block",
                isDark
                  ? "bg-internai-blue text-white hover:brightness-110"
                  : "bg-primary-600 text-white hover:bg-primary-700"
              )}
            >
              Get Started
            </Link>
          )}
          <button
            type="button"
            onClick={() => setMobileOpen((open) => !open)}
            className={cn(
              "rounded-lg border px-2 py-1 transition md:hidden",
              isDark
                ? "border-white/10 bg-internai-elevated/60 text-internai-text hover:bg-internai-elevated"
                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
            )}
            aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={mobileOpen}
          >
            <AppIcon icon={Menu} size="md" />
          </button>
        </div>
      </nav>

      {mobileOpen && (
        <div
          className={cn(
            "border-t px-4 py-3 md:hidden",
            isDark ? "border-[rgba(59,130,246,0.08)] bg-[rgba(10,19,36,0.82)]" : "border-slate-200/70 bg-white/95 dark:border-slate-800 dark:bg-slate-950/95"
          )}
        >
          <ul className="space-y-1">
            {loggedIn && role ? (
              <>
                <li>
                  <Link href={dashboardHref} onClick={() => setMobileOpen(false)} className={mobileLinkClass(pathname.startsWith(dashboardHref))}>
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link href={profileHref} onClick={() => setMobileOpen(false)} className={mobileLinkClass(pathname.startsWith(profileHref))}>
                    Profile
                  </Link>
                </li>
                <li>
                  <button type="button" onClick={handleLogout} className={cn(mobileLinkClass(false), "w-full text-left")}>
                    Logout
                  </button>
                </li>
              </>
            ) : (
              <>
                {PUBLIC_LINKS.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} onClick={() => setMobileOpen(false)} className={mobileLinkClass(link.href === "/" && pathname === "/")}>
                      {link.label}
                    </Link>
                  </li>
                ))}
                {GUEST_AUTH_LINKS.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} onClick={() => setMobileOpen(false)} className={mobileLinkClass(pathname.startsWith(link.href))}>
                      {link.label}
                    </Link>
                  </li>
                ))}
                <li>
                  <Link href="/auth/intern" onClick={() => setMobileOpen(false)} className={mobileLinkClass(pathname.startsWith("/auth/intern"))}>
                    Get Started
                  </Link>
                </li>
              </>
            )}
          </ul>
        </div>
      )}
    </header>
  );
}
