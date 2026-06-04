"use client";

import Link from "next/link";
import { Briefcase, Check, FileUp, GraduationCap, LineChart, Sparkles, Target } from "lucide-react";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { SmartAuthLink } from "@/components/navigation/smart-auth-link";

const REPLAY = { once: false as const };

const TRUST_ITEMS = [
  "AI Resume Analysis",
  "Skill Gap Detection",
  "Smart Internship Matching",
  "Personalized Learning Paths"
] as const;

function HpSection({
  id,
  label,
  title,
  children,
  center = true,
  headerVariant = "fade-up" as const
}: {
  id?: string;
  label: string;
  title: string;
  children: React.ReactNode;
  center?: boolean;
  headerVariant?: "fade-up" | "soft-scale";
}) {
  return (
    <section id={id} className="hp-section">
      <div className={`hp-wrap ${center ? "hp-center" : ""}`}>
        <ScrollReveal variant={headerVariant} distance={10} {...REPLAY}>
          <p className="hp-label">{label}</p>
          <h2 className="hp-title mt-2">{title}</h2>
        </ScrollReveal>
        {children}
      </div>
    </section>
  );
}

export function HomepageHero() {
  return (
    <section className="hp-hero">
      <div className="hp-hero-inner">
        <div className="hp-hero-copy">
          <ScrollReveal variant="soft-scale" distance={12} {...REPLAY}>
            <p className="hp-hero-eyebrow">InternAI</p>
          </ScrollReveal>

          <ScrollReveal variant="fade-up" distance={14} delayMs={60} {...REPLAY}>
            <h1 className="hp-hero-headline">
              The AI-Powered Platform Connecting Talented Interns with Forward-Thinking
              Companies
            </h1>
          </ScrollReveal>

          <ScrollReveal variant="fade-up" distance={10} delayMs={120} {...REPLAY}>
            <div className="hp-hero-lines">
              <p>Career acceleration for interns.</p>
              <p>Smarter hiring for companies.</p>
              <p>Enterprise-ready placement system.</p>
            </div>
          </ScrollReveal>

          <ScrollReveal variant="stagger-children" distance={8} delayMs={180} staggerMs={70} {...REPLAY}>
            <div className="hp-actions hp-actions--left">
              <Link href="/auth" className="hp-btn hp-btn-primary hp-btn-lg">
                Get Started
              </Link>
              <Link href="#how-it-works" className="hp-btn hp-btn-ghost hp-btn-lg">
                Explore Platform
              </Link>
            </div>
          </ScrollReveal>

          <ScrollReveal variant="fade-up" distance={8} delayMs={280} {...REPLAY}>
            <ul className="hp-trust" aria-label="Platform highlights">
              {TRUST_ITEMS.map((item) => (
                <li key={item}>
                  <Check className="hp-trust-icon" strokeWidth={2.5} aria-hidden />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </ScrollReveal>
        </div>

        <ScrollReveal variant="slide-right" distance={16} delayMs={200} {...REPLAY} className="hp-hero-preview-wrap">
          <aside className="hp-preview hp-surface" aria-label="AI Career Coach preview">
            <div className="hp-preview-header">
              <Sparkles className="h-4 w-4 text-[var(--hp-accent)]" strokeWidth={1.5} aria-hidden />
              <span>AI Career Coach</span>
            </div>
            <div className="hp-preview-score">
              <span className="hp-preview-score-label">Resume Match Score</span>
              <span className="hp-preview-score-value">82%</span>
            </div>
            <div className="hp-preview-block">
              <p className="hp-preview-block-label">Top Missing Skills</p>
              <ul className="hp-preview-skills">
                <li>SQL</li>
                <li>Power BI</li>
              </ul>
            </div>
            <div className="hp-preview-block hp-preview-block--accent">
              <p className="hp-preview-block-label">Recommended Next Step</p>
              <p className="hp-preview-next">Complete Data Analytics Learning Path</p>
            </div>
          </aside>
        </ScrollReveal>
      </div>
    </section>
  );
}

const STEPS = [
  { num: "01", label: "Upload Resume", icon: FileUp },
  { num: "02", label: "Analyze Skills", icon: LineChart },
  { num: "03", label: "Match Opportunities", icon: Target }
] as const;

export function HomepageHowItWorks() {
  return (
    <HpSection id="how-it-works" label="Process" title="How InternAI works">
      <div className="hp-reveal-zone">
        <ScrollReveal
          variant="stagger-children"
          className="hp-steps"
          distance={8}
          staggerMs={120}
          threshold={0.12}
          {...REPLAY}
        >
          {STEPS.map((step) => (
            <div key={step.num} className="hp-step hp-surface hp-surface--interactive">
              <span className="hp-step-num">{step.num}</span>
              <div className="hp-step-icon">
                <step.icon className="h-5 w-5" strokeWidth={1.5} aria-hidden />
              </div>
              <h3>{step.label}</h3>
            </div>
          ))}
        </ScrollReveal>
      </div>
    </HpSection>
  );
}

const CAPABILITIES = [
  {
    title: "Resume Intelligence",
    description: "ATS-aware scoring and recruiter-ready insights."
  },
  {
    title: "Skill Gap Analysis",
    description: "Targeted gaps mapped to role requirements."
  },
  {
    title: "Smart Internship Matching",
    description: "AI-ranked opportunities aligned to your profile."
  },
  {
    title: "Learning Recommendations",
    description: "Curated paths to close gaps faster."
  }
] as const;

export function HomepageCapabilities() {
  return (
    <HpSection id="capabilities" label="Platform" title="Platform capabilities">
      <div className="hp-reveal-zone">
        <ScrollReveal
          variant="stagger-children"
          className="hp-grid-4"
          distance={8}
          staggerMs={90}
          threshold={0.12}
          {...REPLAY}
        >
          {CAPABILITIES.map((cap) => (
            <div key={cap.title} className="hp-cap-cell hp-surface hp-surface--interactive">
              <p className="hp-cap-title">{cap.title}</p>
              <p className="hp-cap-desc">{cap.description}</p>
            </div>
          ))}
        </ScrollReveal>
      </div>
    </HpSection>
  );
}

export function HomepageAudience() {
  return (
    <HpSection id="audience" label="For everyone" title="For students & companies">
      <div className="hp-split">
        <ScrollReveal variant="slide-left" distance={14} threshold={0.2} {...REPLAY}>
          <div className="hp-surface hp-split-panel hp-surface--interactive">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-[var(--hp-muted)]" strokeWidth={1.5} aria-hidden />
              <h3>Students</h3>
            </div>
            <ul className="hp-list">
              <li>Improve resume</li>
              <li>Find internships</li>
              <li>Learn relevant skills</li>
            </ul>
            <SmartAuthLink intendedRole="intern" className="hp-btn hp-btn-primary mt-6">
              For Students
            </SmartAuthLink>
          </div>
        </ScrollReveal>
        <ScrollReveal variant="slide-right" distance={14} delayMs={80} threshold={0.2} {...REPLAY}>
          <div className="hp-surface hp-split-panel hp-surface--interactive">
            <div className="flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-[var(--hp-muted)]" strokeWidth={1.5} aria-hidden />
              <h3>Companies</h3>
            </div>
            <ul className="hp-list">
              <li>Discover candidates</li>
              <li>Evaluate skills</li>
              <li>Hire faster</li>
            </ul>
            <SmartAuthLink intendedRole="company" className="hp-btn hp-btn-primary mt-6">
              For Companies
            </SmartAuthLink>
          </div>
        </ScrollReveal>
      </div>
    </HpSection>
  );
}

export function HomepageCoachPreview() {
  return (
    <HpSection id="coach" label="AI coach" title="Career intelligence preview">
      <ScrollReveal variant="soft-scale" distance={12} threshold={0.2} {...REPLAY}>
        <ScrollReveal variant="stagger-children" distance={10} staggerMs={100} threshold={0.15} {...REPLAY}>
          <div className="hp-coach hp-surface">
            <p className="hp-coach-tag">Insight · Data Analyst track</p>
            <blockquote className="hp-coach-quote">
              You are <strong>78%</strong> aligned with Data Analyst roles. Improving SQL and Power
              BI can significantly increase matching opportunities.
            </blockquote>
            <div className="hp-coach-metric">
              <strong>78%</strong>
              <span>role alignment</span>
            </div>
            <div className="hp-coach-bar" aria-hidden>
              <span style={{ width: "78%" }} />
            </div>
          </div>
        </ScrollReveal>
      </ScrollReveal>
    </HpSection>
  );
}

export function HomepageFinalCta() {
  return (
    <section className="hp-section hp-cta">
      <div className="hp-wrap hp-center">
        <ScrollReveal variant="fade-up" distance={12} threshold={0.25} {...REPLAY}>
          <h2 className="hp-title hp-cta-title">Ready to accelerate your career?</h2>
          <ScrollReveal variant="stagger-children" distance={8} delayMs={120} staggerMs={80} {...REPLAY}>
            <div className="hp-actions mt-8">
              <Link href="/auth" className="hp-btn hp-btn-primary hp-btn-lg">
                Start Free
              </Link>
              <Link href="#capabilities" className="hp-btn hp-btn-ghost hp-btn-lg">
                Learn More
              </Link>
            </div>
          </ScrollReveal>
        </ScrollReveal>
      </div>
    </section>
  );
}
