import Link from "next/link";
import { BarChart3, BookOpen, Briefcase, Check, FileSearch, FileUp, GraduationCap, LineChart, Sparkles, Target } from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { SmartAuthLink } from "@/components/navigation/smart-auth-link";
import { CompanyLogoMarquee } from "@/components/home/CompanyLogoMarquee";
import { BRAND_NAME, BRAND_TAGLINE } from "@/lib/brand";

const TRUST_ITEMS = [
  "AI Resume Analysis",
  "Skill Gap Detection",
  "Smart Internship Matching",
  "Personalized Learning Paths"
] as const;

const STEPS = [
  { num: "01", label: "Upload Resume", description: "Add your resume and profile details.", icon: FileUp },
  { num: "02", label: "Analyze Skills", description: "AI scores your resume and finds gaps.", icon: LineChart },
  { num: "03", label: "Match Opportunities", description: "Get internships ranked to your profile.", icon: Target }
] as const;

const CAPABILITIES = [
  { title: "Resume Intelligence", description: "ATS-aware scoring and recruiter-ready insights.", icon: FileSearch, accent: "primary" },
  { title: "Skill Gap Analysis", description: "Targeted gaps mapped to role requirements.", icon: BarChart3, accent: "accent" },
  { title: "Smart Internship Matching", description: "AI-ranked opportunities aligned to your profile.", icon: Sparkles, accent: "primary" },
  { title: "Learning Recommendations", description: "Curated paths to close gaps faster.", icon: BookOpen, accent: "accent" }
] as const;

const btnPrimary =
  "inline-flex items-center justify-center rounded-full bg-[var(--ds-primary)] px-6 py-3 text-sm font-semibold text-[var(--ds-on-primary)] transition hover:bg-[var(--ds-primary-hover)]";
const btnGhost =
  "inline-flex items-center justify-center rounded-full border border-[var(--ds-border)] px-6 py-3 text-sm font-semibold text-[var(--ds-text)] transition hover:bg-[var(--ds-hover)]";
const card =
  "rounded-2xl border border-blue-200 bg-blue-50 p-6 shadow-lg shadow-blue-900/5 transition-shadow duration-200 hover:shadow-xl hover:shadow-blue-900/10 dark:border-blue-900/60 dark:bg-blue-950 dark:shadow-black/30";
const sectionLabel = "text-xs font-semibold uppercase tracking-[0.14em] text-[var(--ds-muted)]";
const sectionTitle = "mt-2 text-3xl font-bold tracking-tight text-[var(--ds-text)] sm:text-4xl";
type IconChipProps = {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties; strokeWidth?: number }>;
  accent?: "primary" | "accent";
  size?: "sm" | "md";
};

// A translucent tinted badge behind a full-opacity icon. Built from a plain
// `background-color` + `opacity` overlay rather than `color-mix()` -- the
// latter isn't reliably supported by every rendering engine this app gets
// previewed in, and silently drops the whole declaration when unsupported
// (no fallback color, just an invisible badge), so this avoids that failure
// mode entirely while landing on the same translucent-wash look.
function IconChip({ icon: Icon, accent = "primary", size = "md" }: IconChipProps) {
  const color = accent === "accent" ? "var(--ds-accent)" : "var(--ds-primary)";
  return (
    <div className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full ${size === "sm" ? "p-2" : "p-3"}`}>
      <span aria-hidden className="absolute inset-0" style={{ backgroundColor: color, opacity: 0.12 }} />
      <Icon className={`relative ${size === "sm" ? "h-4 w-4" : "h-5 w-5"}`} style={{ color }} strokeWidth={2} />
    </div>
  );
}

export default function HomePage() {
  return (
    <main id="main-content" tabIndex={-1} className="min-h-screen bg-[var(--ds-bg)] text-[var(--ds-text)] focus:outline-none">
      <Navbar />

      <section id="hero" className="container-shell relative overflow-hidden py-8 sm:py-12">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div
            className="absolute left-1/2 top-0 h-[26rem] w-[26rem] -translate-x-[65%] -translate-y-1/3 rounded-full blur-3xl"
            style={{ backgroundColor: "var(--ds-primary)", opacity: 0.14 }}
          />
          <div
            className="absolute left-1/2 top-0 h-[22rem] w-[22rem] translate-x-[5%] -translate-y-1/4 rounded-full blur-3xl"
            style={{ backgroundColor: "var(--ds-accent)", opacity: 0.12 }}
          />
        </div>
        <div className="mx-auto max-w-3xl text-center">
          <p className={sectionLabel}>{BRAND_NAME}</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
            Matching skilled interns with companies ready to grow them.
          </h1>
          <p className="mt-5 text-lg text-[var(--ds-muted)]">
            {BRAND_TAGLINE}. Career acceleration for interns. Smarter hiring for companies.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href="/auth" className={btnPrimary}>
              Get Started
            </Link>
            <Link href="#how-it-works" className={btnGhost}>
              Explore Platform
            </Link>
          </div>

          <ul className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-3" aria-label="Platform highlights">
            {TRUST_ITEMS.map((item) => (
              <li key={item} className="flex items-center gap-1.5 text-sm text-[var(--ds-muted)]">
                <Check className="h-4 w-4 text-[var(--ds-primary)]" strokeWidth={2.5} aria-hidden />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="trusted-by" className="overflow-x-hidden py-6 sm:py-10">
        <div className="container-shell text-center">
          <p className={sectionLabel}>Trusted network</p>
          <h2 className={sectionTitle}>Where CareerSetu candidates land</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-[var(--ds-muted)]">
            CareerSetu connects interns with opportunities at leading companies worldwide.
          </p>
        </div>

        <div className="mt-6">
          <CompanyLogoMarquee />
        </div>
      </section>

      <section id="how-it-works" className="container-shell py-10 sm:py-14">
        <div className="text-center">
          <p className={sectionLabel}>Process</p>
          <h2 className={sectionTitle}>How {BRAND_NAME} works</h2>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          {STEPS.map((step) => (
            <div key={step.num} className={card}>
              <span className="text-sm font-semibold text-[var(--ds-muted)]">{step.num}</span>
              <div className="mt-3">
                <IconChip icon={step.icon} />
              </div>
              <h3 className="mt-4 text-base font-semibold">{step.label}</h3>
              <p className="mt-1.5 text-sm text-[var(--ds-muted)]">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="capabilities" className="container-shell py-10 sm:py-14">
        <div className="text-center">
          <p className={sectionLabel}>Platform</p>
          <h2 className={sectionTitle}>Platform capabilities</h2>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {CAPABILITIES.map((cap) => (
            <div key={cap.title} className={card}>
              <IconChip icon={cap.icon} accent={cap.accent} />
              <p className="mt-4 text-base font-semibold">{cap.title}</p>
              <p className="mt-1.5 text-sm text-[var(--ds-muted)]">{cap.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="audience" className="container-shell py-10 sm:py-14">
        <div className="text-center">
          <p className={sectionLabel}>For everyone</p>
          <h2 className={sectionTitle}>For students &amp; companies</h2>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <div className={card}>
            <div className="flex items-center gap-3">
              <IconChip icon={GraduationCap} size="sm" />
              <h3 className="text-lg font-semibold">Students</h3>
            </div>
            <ul className="mt-4 space-y-2 text-sm text-[var(--ds-muted)]">
              <li>Improve resume</li>
              <li>Find internships</li>
              <li>Learn relevant skills</li>
            </ul>
            <SmartAuthLink intendedRole="intern" className={`${btnPrimary} mt-6`}>
              For Students
            </SmartAuthLink>
          </div>

          <div className={card}>
            <div className="flex items-center gap-3">
              <IconChip icon={Briefcase} size="sm" />
              <h3 className="text-lg font-semibold">Companies</h3>
            </div>
            <ul className="mt-4 space-y-2 text-sm text-[var(--ds-muted)]">
              <li>Discover candidates</li>
              <li>Evaluate skills</li>
              <li>Hire faster</li>
            </ul>
            <SmartAuthLink intendedRole="company" className={`${btnPrimary} mt-6`}>
              For Companies
            </SmartAuthLink>
          </div>
        </div>
      </section>

      <section className="container-shell py-10 sm:py-14">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className={sectionTitle}>Ready to accelerate your career?</h2>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href="/auth" className={btnPrimary}>
              Start Free
            </Link>
            <Link href="#capabilities" className={btnGhost}>
              Learn More
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
