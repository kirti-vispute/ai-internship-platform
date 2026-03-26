import Link from "next/link";

const links = [
  { href: "/", label: "Home" },
  { href: "/dashboard/intern", label: "Intern Dashboard" },
  { href: "/dashboard/company", label: "Company Dashboard" }
];

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/80 backdrop-blur-xl">
      <nav className="container-shell flex h-16 items-center justify-between">
        <Link href="/" className="text-lg font-extrabold tracking-tight text-ink">
          InternAI
        </Link>

        <div className="hidden items-center gap-2 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full px-3 py-1.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <p className="hidden rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wider text-slate-500 sm:block">
          AI Internship Platform
        </p>
      </nav>
    </header>
  );
}
