"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { LayoutDashboard, LogOut, Menu, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { InternAILogo } from "@/components/brand/internai-logo";
import { AppIcon } from "@/components/icons/app-icon";
import { getDashboardPathForRole, getProfilePathForRole } from "@/lib/auth-routes";
import { logoutAuthSession } from "@/lib/api-client";
import { useAuthSession } from "@/lib/use-auth-session";

const HOMEPAGE_SECTION_LINKS = [
  { hash: "hero", label: "Home" },
  { hash: "how-it-works", label: "How it works" },
  { hash: "capabilities", label: "Capabilities" }
] as const;

const HOMEPAGE_AUTH_LINKS = [
  { href: "/auth/intern", label: "Intern Login" },
  { href: "/auth/company", label: "Company Login" }
] as const;

type NavbarProps = {
  theme?: "light" | "dark";
};

function homepageSectionHref(hash: string, onHome: boolean) {
  return onHome ? `#${hash}` : `/#${hash}`;
}

function scrollToSection(hash: string) {
  const id = hash.replace(/^#/, "");
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function Navbar({ theme = "light" }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeHash, setActiveHash] = useState("#hero");
  const { loggedIn, role } = useAuthSession();
  const isDark = theme === "dark";
  const isHome = pathname === "/";
  const isAuthPage = pathname.startsWith("/auth");

  const dashboardHref = role ? getDashboardPathForRole(role) : "/";
  const profileHref = role ? getProfilePathForRole(role) : "/";

  const handleLogout = async () => {
    await logoutAuthSession();
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

  const scrollHashOnLoad = useCallback(() => {
    if (!isHome || typeof window === "undefined") return;
    const hash = window.location.hash;
    if (!hash) return;
    requestAnimationFrame(() => scrollToSection(hash));
  }, [isHome]);

  useEffect(() => {
    if (!isHome) return;

    const syncHash = () => {
      setActiveHash(window.location.hash || "#hero");
    };

    syncHash();
    scrollHashOnLoad();
    window.addEventListener("hashchange", syncHash);
    return () => window.removeEventListener("hashchange", syncHash);
  }, [isHome, scrollHashOnLoad, pathname]);

  const handleHomepageSectionClick = (
    event: React.MouseEvent<HTMLAnchorElement>,
    hash: string
  ) => {
    setMobileOpen(false);
    if (!isHome) return;

    event.preventDefault();
    const target = `#${hash}`;
    scrollToSection(target);
    window.history.pushState(null, "", target);
    setActiveHash(target);
  };

  const isSectionActive = (hash: string) =>
    isHome && (activeHash === `#${hash}` || (hash === "hero" && activeHash === "#hero"));

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
        {isAuthPage ? (
          <span className="inline-block h-[34px] w-[34px] shrink-0" aria-hidden />
        ) : (
          <InternAILogo href="/" />
        )}

        <div className="hidden items-center gap-2 md:flex">
          {isHome ? (
            <>
              {HOMEPAGE_SECTION_LINKS.map((link) => (
                <Link
                  key={link.hash}
                  href={homepageSectionHref(link.hash, true)}
                  className={linkClass(isSectionActive(link.hash))}
                  onClick={(event) => handleHomepageSectionClick(event, link.hash)}
                >
                  {link.label}
                </Link>
              ))}
              {HOMEPAGE_AUTH_LINKS.map((link) => (
                <Link key={link.href} href={link.href} className={linkClass(false)}>
                  {link.label}
                </Link>
              ))}
            </>
          ) : loggedIn && role ? (
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
            </>
          ) : (
            <>
              {HOMEPAGE_SECTION_LINKS.map((link) => (
                <Link
                  key={link.hash}
                  href={homepageSectionHref(link.hash, false)}
                  className={linkClass(false)}
                >
                  {link.label}
                </Link>
              ))}
              {HOMEPAGE_AUTH_LINKS.map((link) => (
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
          {loggedIn && role && !isHome ? (
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
          ) : loggedIn && role && isHome ? (
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
          ) : null}
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
            {isHome ? (
              <>
                {HOMEPAGE_SECTION_LINKS.map((link) => (
                  <li key={link.hash}>
                    <Link
                      href={homepageSectionHref(link.hash, true)}
                      onClick={(event) => handleHomepageSectionClick(event, link.hash)}
                      className={mobileLinkClass(isSectionActive(link.hash))}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
                {HOMEPAGE_AUTH_LINKS.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      onClick={() => setMobileOpen(false)}
                      className={mobileLinkClass(pathname.startsWith(link.href))}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
                {loggedIn && role ? (
                  <li>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className={cn(mobileLinkClass(false), "w-full text-left")}
                    >
                      Logout
                    </button>
                  </li>
                ) : null}
              </>
            ) : loggedIn && role ? (
              <>
                <li>
                  <Link
                    href={dashboardHref}
                    onClick={() => setMobileOpen(false)}
                    className={mobileLinkClass(pathname.startsWith(dashboardHref))}
                  >
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link
                    href={profileHref}
                    onClick={() => setMobileOpen(false)}
                    className={mobileLinkClass(pathname.startsWith(profileHref))}
                  >
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
                {HOMEPAGE_SECTION_LINKS.map((link) => (
                  <li key={link.hash}>
                    <Link
                      href={homepageSectionHref(link.hash, false)}
                      onClick={() => setMobileOpen(false)}
                      className={mobileLinkClass(false)}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
                {HOMEPAGE_AUTH_LINKS.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      onClick={() => setMobileOpen(false)}
                      className={mobileLinkClass(pathname.startsWith(link.href))}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </>
            )}
          </ul>
        </div>
      )}
    </header>
  );
}
