"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/** Continuous wall section — flows with neighbors, no isolated island */
export function WallSection({
  id,
  children,
  className,
  contentClassName,
  variant = "default"
}: {
  id?: string;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
  variant?: "default" | "flush" | "cta";
}) {
  return (
    <section
      id={id}
      className={cn(
        "internai-wall-section",
        variant === "flush" && "internai-wall-section--flush",
        variant === "cta" && "internai-wall-section--cta",
        className
      )}
    >
      <div className={cn("internai-wall-section-inner", contentClassName)}>{children}</div>
    </section>
  );
}

export function SectionBlock({
  id,
  children,
  className,
  contentClassName
}: {
  id?: string;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
}) {
  return (
    <WallSection id={id} className={className} contentClassName={contentClassName}>
      {children}
    </WallSection>
  );
}

/** Alias for sections outside the homepage wall continuum */
export function SectionShell({
  id,
  children,
  className
}: {
  id?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={cn("internai-section homepage-section", className)}>
      <div className="internai-container internai-section-block">{children}</div>
    </section>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
  className
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  className?: string;
}) {
  return (
    <header
      className={cn(
        "internai-wall-heading",
        align === "center" && "internai-wall-heading--center",
        className
      )}
    >
      {eyebrow ? <p className="internai-eyebrow">{eyebrow}</p> : null}
      <h2 className={cn("internai-heading-section", eyebrow && "mt-1.5")}>{title}</h2>
      {description ? (
        <p className={cn("internai-body mt-1 max-w-md", align === "center" && "mx-auto")}>
          {description}
        </p>
      ) : null}
    </header>
  );
}

/** Embedded matrix — shared panel wall, cells are bricks not floating cards */
export function EmbedMatrix({
  children,
  cols = 3,
  className
}: {
  children: React.ReactNode;
  cols?: 2 | 3 | 4;
  className?: string;
}) {
  return (
    <div className={cn("internai-embed-matrix", `internai-embed-matrix--${cols}`, className)}>
      {children}
    </div>
  );
}

export function CardGrid({
  children,
  cols = 3,
  className
}: {
  children: React.ReactNode;
  cols?: 2 | 3 | 4;
  className?: string;
}) {
  return (
    <EmbedMatrix cols={cols} className={className}>
      {children}
    </EmbedMatrix>
  );
}

export function EmbedCell({
  children,
  className,
  interactive = true
}: {
  children: React.ReactNode;
  className?: string;
  interactive?: boolean;
}) {
  return (
    <div className={cn("internai-embed-cell", interactive && "internai-embed-cell--interactive", className)}>
      {children}
    </div>
  );
}

export function EmbedPanel({
  children,
  className
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("internai-embed-panel", className)}>{children}</div>;
}

export function HomeTile({
  children,
  className,
  as: Tag = "article"
}: {
  children: React.ReactNode;
  className?: string;
  as?: "article" | "div";
}) {
  return <Tag className={cn("internai-embed-panel internai-embed-panel--solo", className)}>{children}</Tag>;
}

export function HomeCard({
  children,
  className
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <HomeTile className={cn("internai-embed-panel-padding", className)}>{children}</HomeTile>;
}

export function GlassPanel({
  children,
  className
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("internai-embed-panel internai-embed-panel-padding", className)}>{children}</div>;
}

export function TileIcon({
  icon: Icon,
  className
}: {
  icon: LucideIcon;
  className?: string;
}) {
  return (
    <span className={cn("internai-embed-icon", className)}>
      <Icon className="h-4 w-4" strokeWidth={1.75} aria-hidden />
    </span>
  );
}

export function HomeButton({
  href,
  children,
  variant = "primary",
  className
}: {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  className?: string;
}) {
  const styles = {
    primary: "internai-btn-primary",
    secondary: "internai-btn-secondary",
    ghost: "internai-btn-ghost"
  };
  return (
    <Link href={href} className={cn(styles[variant], className)}>
      {children}
    </Link>
  );
}

export function AiInsightBadge({ children }: { children: React.ReactNode }) {
  return <span className="internai-badge">{children}</span>;
}

export function HomeProgressBar({ value, label }: { value: number; label?: string }) {
  const width = Math.max(0, Math.min(100, value));
  return (
    <div>
      {label ? (
        <div className="mb-1 flex justify-between gap-2 text-xs">
          <span className="text-internai-muted">{label}</span>
          <span className="font-semibold tabular-nums text-internai-text">{width}%</span>
        </div>
      ) : null}
      <div className="internai-progress-track">
        <div className="internai-progress-fill" style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

export function SkillChip({ children }: { children: React.ReactNode }) {
  return <span className="internai-chip">{children}</span>;
}

export function TileTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return <h3 className={cn("internai-embed-title", className)}>{children}</h3>;
}

export function TileText({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={cn("internai-embed-text", className)}>{children}</p>;
}

export function EmbedRow({
  children,
  className
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("internai-embed-row", className)}>{children}</div>;
}
