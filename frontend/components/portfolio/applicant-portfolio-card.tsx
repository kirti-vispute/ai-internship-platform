"use client";

import Link from "next/link";
import { ExternalLink, Sparkles } from "lucide-react";
import type { PortfolioSummary } from "@/lib/portfolio-types";
import { portfolioPublicPath } from "@/lib/portfolio-portal";
import { Button } from "@/components/ui/button";

type ApplicantPortfolioCardProps = {
  portfolio?: PortfolioSummary | null;
  internName?: string;
  compact?: boolean;
};

export function ApplicantPortfolioCard({ portfolio, internName, compact = false }: ApplicantPortfolioCardProps) {
  if (!portfolio?.slug) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200/80 bg-slate-50/50 px-4 py-5 text-sm text-slate-500 dark:border-slate-700/80 dark:bg-slate-900/20">
        {internName || "Candidate"} has not published a 3D portfolio yet.
      </div>
    );
  }

  const href = portfolio.portfolioUrl || portfolioPublicPath(portfolio.slug);

  return (
    <div className="relative overflow-hidden rounded-xl border border-slate-200/80 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 px-4 py-4 shadow-lg shadow-slate-900/20 dark:border-slate-700/60">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_0%_0%,rgba(59,130,246,0.18),transparent_55%)]" aria-hidden />
      <div className="relative flex items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-blue-300/90">
            <Sparkles className="h-3.5 w-3.5" />
            3D Portfolio
          </p>
          <p className="mt-1.5 text-sm font-semibold tracking-tight text-white">
            {internName ? `${internName}'s portfolio` : "Candidate portfolio"}
          </p>
          {!compact ? (
            <p className="mt-1.5 text-xs text-slate-400">
              Theme: {portfolio.theme || "midnight"}
              {portfolio.lastGeneratedAt ? ` · Updated ${new Date(portfolio.lastGeneratedAt).toLocaleDateString()}` : ""}
              {typeof portfolio.viewCount === "number" ? ` · ${portfolio.viewCount} views` : ""}
            </p>
          ) : null}
        </div>
        <Link href={href} target="_blank" rel="noopener noreferrer" className="shrink-0">
          <Button type="button" size="sm" className="border-white/10 bg-white/10 text-white hover:bg-white/15">
            <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
            View Portfolio
          </Button>
        </Link>
      </div>
    </div>
  );
}
