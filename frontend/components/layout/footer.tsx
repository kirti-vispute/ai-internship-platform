import Link from "next/link";
import Image from "next/image";
import { BRAND_TAGLINE, BRAND_NAME } from "@/lib/brand";
import { cn } from "@/lib/utils";

const FOOTER_LINKS = {
  company: [
    { label: "About", href: "/" },
    { label: "Contact", href: "mailto:support@internai.example" },
    { label: "Support", href: "/dashboard/intern/support" }
  ],
  legal: [
    { label: "Privacy Policy", href: "#privacy" },
    { label: "Terms of Service", href: "#terms" }
  ],
  social: [
    { label: "LinkedIn", href: "https://linkedin.com" },
    { label: "Twitter", href: "https://twitter.com" }
  ]
};

type FooterProps = { theme?: "light" | "dark" };

export function Footer({ theme = "light" }: FooterProps) {
  const isDark = theme === "dark";
  return (
    <footer
      className={cn(
        "border-t",
        isDark
          ? "border-[rgba(59,130,246,0.08)] bg-[rgba(10,19,36,0.45)] backdrop-blur-xl"
          : "border-slate-200 bg-white/90 dark:border-slate-800 dark:bg-slate-950/80"
      )}
    >
      <div className="container-shell grid gap-8 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2 lg:col-span-1">
          <div className="flex items-center gap-3">
            <Image src="/brand/logo-icon.svg" alt="" width={36} height={36} className="shrink-0" aria-hidden />
            <div>
              <p className={cn("text-lg font-bold", isDark ? "text-internai-text" : "text-ink dark:text-slate-100")}>{BRAND_NAME}</p>
              <p className={cn("mt-1 text-xs", isDark ? "text-internai-muted" : "text-slate-500 dark:text-slate-400")}>{BRAND_TAGLINE}</p>
            </div>
          </div>
          <p className={cn("mt-3 max-w-sm text-sm", isDark ? "text-internai-muted" : "text-slate-600 dark:text-slate-400")}>
            Career acceleration for interns. Intelligent hiring for companies. Enterprise-ready placement management.
          </p>
        </div>

        <div>
          <p className={cn("text-sm font-semibold", isDark ? "text-internai-text" : "dark:text-slate-100")}>Company</p>
          <ul className={cn("mt-2 space-y-2 text-sm", isDark ? "text-internai-muted" : "text-slate-600 dark:text-slate-400")}>
            {FOOTER_LINKS.company.map((link) => (
              <li key={link.label}>
                <Link
                  href={link.href}
                  className={cn(
                    "transition",
                    isDark ? "hover:text-internai-blue" : "hover:text-primary-600 dark:hover:text-primary-300"
                  )}
                  data-cursor="link"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className={cn("text-sm font-semibold", isDark ? "text-internai-text" : "dark:text-slate-100")}>Legal</p>
          <ul className={cn("mt-2 space-y-2 text-sm", isDark ? "text-internai-muted" : "text-slate-600 dark:text-slate-400")}>
            {FOOTER_LINKS.legal.map((link) => (
              <li key={link.label}>
                <Link
                  href={link.href}
                  className={cn(
                    "transition",
                    isDark ? "hover:text-internai-blue" : "hover:text-primary-600 dark:hover:text-primary-300"
                  )}
                  data-cursor="link"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
          <p className={cn("mt-4 text-sm font-semibold", isDark ? "text-internai-text" : "dark:text-slate-100")}>Connect</p>
          <ul className={cn("mt-2 space-y-2 text-sm", isDark ? "text-internai-muted" : "text-slate-600 dark:text-slate-400")}>
            {FOOTER_LINKS.social.map((link) => (
              <li key={link.label}>
                <a
                  href={link.href}
                  target="_blank"
                  rel="noreferrer"
                  className={cn(
                    "transition",
                    isDark ? "hover:text-internai-blue" : "hover:text-primary-600 dark:hover:text-primary-300"
                  )}
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className={cn("text-sm font-semibold", isDark ? "text-internai-text" : "dark:text-slate-100")}>Contact</p>
          <p className={cn("mt-2 text-sm", isDark ? "text-internai-muted" : "text-slate-600 dark:text-slate-400")}>support@internai.example</p>
          <p className={cn("text-sm", isDark ? "text-internai-muted" : "text-slate-600 dark:text-slate-400")}>+91 90000 00000</p>
          <p className={cn("mt-4 text-xs", isDark ? "text-internai-muted/80" : "text-slate-500 dark:text-slate-500")}>Mon–Fri, 9:00 AM – 6:00 PM IST</p>
        </div>
      </div>

      <div className={cn("border-t py-4", isDark ? "border-white/[0.06]" : "border-slate-200 dark:border-slate-800")}>
        <div className="container-shell flex flex-col items-center justify-between gap-2 text-center sm:flex-row sm:text-left">
          <p className={cn("text-xs", isDark ? "text-internai-muted" : "text-slate-500 dark:text-slate-500")}>
            © {new Date().getFullYear()} {BRAND_NAME} Platform. All rights reserved.
          </p>
          <p className={cn("text-[10px] font-semibold uppercase tracking-[0.14em]", isDark ? "text-internai-muted/70" : "text-slate-400")}>
            Generated by InternAI
          </p>
        </div>
      </div>
    </footer>
  );
}
