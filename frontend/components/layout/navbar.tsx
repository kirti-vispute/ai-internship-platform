import Link from "next/link";
import { ThemeToggle } from "@/components/ui/theme-toggle";

const links = [
  { href: "/", label: "Home" },
  { href: "/dashboard/intern", label: "Intern Dashboard" },
  { href: "/dashboard/company", label: "Company Dashboard" }
];

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/80 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/80">
      <nav className="container-shell flex h-16 items-center justify-between">
        <Link href="/" className="text-lg font-extrabold tracking-tight text-ink dark:text-slate-100">
          InternAI
        </Link>

        <div className="hidden items-center gap-2 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full px-3 py-1.5 text-sm font-semibold text-slate-600 transition duration-200 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle className="hidden sm:inline-flex" />
          <p className="hidden rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 sm:block">
            AI Internship Platform
          </p>
        </div>
      </nav>
    </header>
  );
}
