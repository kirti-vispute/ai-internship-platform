"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MapPin, Briefcase, Clock, Sparkles, ChevronDown, ChevronUp, RefreshCw } from "lucide-react";
import { SectionPanel } from "@/components/dashboard/shared/section-panel";
import { EmptyState } from "@/components/dashboard/shared/empty-state";
import { SkeletonList } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { AppIcon } from "@/components/icons/app-icon";
import { useToast } from "@/components/ui/toast";
import {
  JOB_AGENT_CATEGORY_LABELS,
  JOB_AGENT_SOURCE_LABELS,
  JobAgentStatus,
  JobProviderHealth,
  UnifiedJob,
  fetchJobAgentFeed,
  fetchJobAgentProviderHealth,
  fetchJobAgentStatus,
  isSafeExternalUrl,
  pauseJobAgent,
  resumeJobAgent,
  trackJobAgentJob
} from "@/lib/job-agent-portal";

function fitScoreTone(score: number): BadgeTone {
  if (score >= 75) return "success";
  if (score >= 50) return "warning";
  return "danger";
}

function postingAgeLabel(postedAt: string | null): string | null {
  if (!postedAt) return null;
  const posted = new Date(postedAt).getTime();
  if (Number.isNaN(posted)) return null;
  const days = Math.floor((Date.now() - posted) / (1000 * 60 * 60 * 24));
  if (days <= 0) return "Posted today";
  if (days === 1) return "Posted 1 day ago";
  return `Posted ${days} days ago`;
}

function providerHealthTone(status: JobProviderHealth["status"]): BadgeTone {
  if (status === "ok") return "success";
  if (status === "partial") return "warning";
  if (status === "failed") return "danger";
  return "neutral";
}

function providerHealthLabel(provider: JobProviderHealth): string {
  switch (provider.status) {
    case "ok":
      return provider.lastSuccessAt ? `Synced ${new Date(provider.lastSuccessAt).toLocaleString()}` : "Synced";
    case "partial":
      return "Partially synced";
    case "failed":
      return "Sync failed";
    case "needs_credentials":
      return "Needs credentials";
    case "no_legitimate_api":
      return "Requires partnership";
    default:
      return "Not yet synced";
  }
}

// A sweep older than this is surfaced as a gentle "may be stale" hint
// rather than silently presenting last-run matches as if they were fresh.
const STALE_SWEEP_MS = 24 * 60 * 60 * 1000;

function isSweepStale(lastSweepAt: string | null): boolean {
  if (!lastSweepAt) return false;
  return Date.now() - new Date(lastSweepAt).getTime() > STALE_SWEEP_MS;
}

export default function JobAgentDashboardPage() {
  const { pushToast } = useToast();
  const [status, setStatus] = useState<JobAgentStatus | null>(null);
  const [jobs, setJobs] = useState<UnifiedJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [roleFilter, setRoleFilter] = useState("");
  const [workModeFilter, setWorkModeFilter] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [minSalaryFilter, setMinSalaryFilter] = useState("");
  const [entryLevelOnly, setEntryLevelOnly] = useState(false);
  const [sourceFilter, setSourceFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [savingJobId, setSavingJobId] = useState<string | null>(null);
  const [togglingAgent, setTogglingAgent] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalJobs, setTotalJobs] = useState(0);
  const [providers, setProviders] = useState<JobProviderHealth[]>([]);
  const [sourcesExpanded, setSourcesExpanded] = useState(false);
  const [expandedConcernId, setExpandedConcernId] = useState<string | null>(null);
  const PAGE_SIZE = 25;

  type FilterOverrides = {
    role?: string;
    workMode?: string;
    location?: string;
    minSalary?: string;
    source?: string;
    category?: string;
    entryLevelOnly?: boolean;
  };

  // Accepts explicit overrides rather than only reading the filter state
  // variables from closure -- Reset calls the setX state setters AND this
  // function in the same handler, and React state updates aren't visible
  // in that same closure yet, so without overrides Reset would re-fetch
  // using the filters it was just asked to clear.
  async function loadAll(targetPage: number, overrides: FilterOverrides = {}) {
    try {
      setError(null);
      const role = overrides.role ?? roleFilter;
      const workMode = overrides.workMode ?? workModeFilter;
      const location = overrides.location ?? locationFilter;
      const minSalaryRaw = overrides.minSalary ?? minSalaryFilter;
      const source = overrides.source ?? sourceFilter;
      const category = overrides.category ?? categoryFilter;
      const entryOnly = overrides.entryLevelOnly ?? entryLevelOnly;
      const parsedMinSalary = minSalaryRaw.trim() ? Number(minSalaryRaw) : undefined;
      const [loadedStatus, feed, providerHealth] = await Promise.all([
        fetchJobAgentStatus(),
        fetchJobAgentFeed({
          role: role || undefined,
          workMode: workMode || undefined,
          location: location || undefined,
          source: source || undefined,
          category: category || undefined,
          minSalary: Number.isFinite(parsedMinSalary) ? parsedMinSalary : undefined,
          entryLevelOnly: entryOnly || undefined,
          page: targetPage,
          limit: PAGE_SIZE
        }),
        fetchJobAgentProviderHealth().catch(() => [] as JobProviderHealth[])
      ]);
      setStatus(loadedStatus);
      setJobs(feed.jobs);
      setProviders(providerHealth);
      const pagination = feed.meta?.pagination;
      setTotalPages(Math.max(1, pagination?.totalPages ?? 1));
      setTotalJobs(pagination?.total ?? feed.jobs.length);
      setPage(targetPage);
    } catch (e) {
      setError((e as Error).message || "Failed to load your AI Job Agent.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filters re-scope the whole result set, so a filter change always starts
  // back on page 1 -- otherwise "page 3" from a wide search could silently
  // land past the end of a narrower one and render nothing.
  async function handleApplyFilters() {
    setLoading(true);
    await loadAll(1);
  }

  function handleResetFilters() {
    setRoleFilter("");
    setWorkModeFilter("");
    setLocationFilter("");
    setMinSalaryFilter("");
    setSourceFilter("");
    setCategoryFilter("");
    setEntryLevelOnly(false);
    setLoading(true);
    loadAll(1, { role: "", workMode: "", location: "", minSalary: "", source: "", category: "", entryLevelOnly: false });
  }

  async function handleGoToPage(targetPage: number) {
    if (targetPage < 1 || targetPage > totalPages || targetPage === page) return;
    setLoading(true);
    await loadAll(targetPage);
  }

  async function handleToggleAgent() {
    if (!status) return;
    setTogglingAgent(true);
    try {
      const updated = status.enabled ? await pauseJobAgent() : await resumeJobAgent();
      setStatus((prev) => (prev ? { ...prev, enabled: updated.enabled, pausedAt: updated.pausedAt } : prev));
      pushToast({ title: updated.enabled ? "Job Agent enabled" : "Job Agent paused", variant: "success" });
    } catch (e) {
      pushToast({ title: "Couldn't update Job Agent", message: (e as Error).message, variant: "error" });
    } finally {
      setTogglingAgent(false);
    }
  }

  async function handleSaveJob(job: UnifiedJob) {
    setSavingJobId(job.id);
    try {
      await trackJobAgentJob(job, "saved");
      pushToast({ title: "Saved to your tracker", variant: "success" });
    } catch (e) {
      pushToast({ title: "Couldn't save this job", message: (e as Error).message, variant: "error" });
    } finally {
      setSavingJobId(null);
    }
  }

  const needsProfile = error?.includes("PROFILE_REQUIRED") || error?.toLowerCase().includes("complete your careersetu profile");

  const providerSummary = providers.reduce(
    (acc, p) => {
      if (p.status === "ok" || p.status === "partial") acc.active += 1;
      else if (p.status === "needs_credentials") acc.needsSetup += 1;
      else acc.unavailable += 1;
      return acc;
    },
    { active: 0, needsSetup: 0, unavailable: 0 }
  );

  const lastSweepIsStale = isSweepStale(status?.lastSweepAt ?? null);

  return (
    <div className="space-y-5">
      <SectionPanel title="AI Job Agent" subtitle="Discovers and ranks jobs for you automatically.">
        {loading && !status ? (
          <SkeletonList rows={2} />
        ) : status ? (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <Badge tone={status.enabled ? "success" : "neutral"} dot>
                  {status.enabled ? "Active" : "Paused"}
                </Badge>
                <div className="flex items-center gap-2 text-sm text-[var(--ds-text-secondary)]">
                  <span className="h-1.5 w-20 overflow-hidden rounded-full bg-[var(--ds-surface-raised)]" aria-hidden>
                    <span
                      className="block h-full rounded-full bg-[var(--ds-accent)]"
                      style={{ width: `${status.profileCompleteness.percent}%` }}
                    />
                  </span>
                  Profile <strong>{status.profileCompleteness.percent}%</strong> complete
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="button" size="sm" variant="secondary" href="/dashboard/intern/job-agent/settings">
                  Agent Settings
                </Button>
                <Button type="button" size="sm" onClick={handleToggleAgent} disabled={togglingAgent}>
                  {status.enabled ? "Pause Agent" : "Enable Agent"}
                </Button>
              </div>
            </div>
            {status.lastSweepAt && (
              <p className="flex items-center gap-1.5 text-xs text-[var(--ds-muted)]">
                <AppIcon icon={Clock} size="xs" />
                Last checked {new Date(status.lastSweepAt).toLocaleString()} — {status.lastSweepMatchCount} matches
                {lastSweepIsStale && (
                  <span className="inline-flex items-center gap-1 text-[var(--ds-warning)]">
                    <AppIcon icon={RefreshCw} size="xs" className="text-[var(--ds-warning)]" />
                    may be stale
                  </span>
                )}
              </p>
            )}
          </div>
        ) : null}
        {status && status.profileCompleteness.missing.length > 0 && (
          <p className="mt-3 text-xs text-[var(--ds-muted)]">
            To improve your matches: {status.profileCompleteness.missing.join(", ")}.
          </p>
        )}
      </SectionPanel>

      {providers.length > 0 && (
        <SectionPanel title="Job Sources" subtitle="Which sources are feeding your matches.">
          <button
            type="button"
            onClick={() => setSourcesExpanded((v) => !v)}
            className="flex w-full items-center justify-between gap-2 rounded-lg border border-[var(--ds-border)] bg-[var(--ds-surface-raised)] px-3 py-2 text-left text-xs font-medium text-[var(--ds-text-secondary)] transition hover:border-[var(--ds-border-strong)]"
            aria-expanded={sourcesExpanded}
          >
            <span>
              <span className="text-[var(--ds-success)]">{providerSummary.active} syncing</span>
              {" · "}
              <span className="text-[var(--ds-muted)]">{providerSummary.needsSetup} need setup</span>
              {" · "}
              <span className="text-[var(--ds-muted)]">{providerSummary.unavailable} unavailable</span>
            </span>
            <AppIcon icon={sourcesExpanded ? ChevronUp : ChevronDown} size="sm" />
          </button>
          {sourcesExpanded && (
            <div className="mt-2 grid grid-cols-1 gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
              {providers.map((provider) => (
                <div
                  key={provider.source}
                  title={providerHealthLabel(provider)}
                  className="flex items-center justify-between gap-1.5 rounded-lg border border-[var(--ds-border)] px-2.5 py-1.5 text-xs"
                >
                  <span className="shrink-0 font-medium text-[var(--ds-text)]">
                    {JOB_AGENT_SOURCE_LABELS[provider.source as keyof typeof JOB_AGENT_SOURCE_LABELS] || provider.source}
                  </span>
                  <Badge tone={providerHealthTone(provider.status)} className="shrink-0">
                    {providerHealthLabel(provider)}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </SectionPanel>
      )}

      <SectionPanel title="Recommended Jobs" subtitle="Ranked by fit score across CareerSetu internships and external listings.">
        <div className="mb-4 rounded-xl border border-[var(--ds-border)] bg-[var(--ds-surface-raised)] p-3">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <Input placeholder="e.g. Frontend Engineer" aria-label="Role" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="h-10 text-sm" />
            <Select aria-label="Work mode" value={workModeFilter} onChange={(e) => setWorkModeFilter(e.target.value)} className="h-10 text-sm">
              <option value="">Any work mode</option>
              <option value="remote">Remote</option>
              <option value="hybrid">Hybrid</option>
              <option value="on-site">On-site</option>
            </Select>
            <Input placeholder="e.g. Bangalore" aria-label="Location" value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)} className="h-10 text-sm" />
            <Input type="number" min={0} placeholder="Min salary" aria-label="Min salary" value={minSalaryFilter} onChange={(e) => setMinSalaryFilter(e.target.value)} className="h-10 text-sm" />
            <Select aria-label="Source" value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)} className="h-10 text-sm">
              <option value="">All sources</option>
              {Object.entries(JOB_AGENT_SOURCE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </Select>
            <Select aria-label="Category" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="h-10 text-sm">
              <option value="">All categories</option>
              {Object.entries(JOB_AGENT_CATEGORY_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </Select>
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <label className="flex items-center gap-2 text-sm text-[var(--ds-text-secondary)]">
              <input type="checkbox" checked={entryLevelOnly} onChange={(e) => setEntryLevelOnly(e.target.checked)} />
              Entry-level only
            </label>
            <div className="flex gap-2">
              <Button type="button" size="sm" variant="ghost" onClick={handleResetFilters}>
                Reset
              </Button>
              <Button type="button" size="sm" variant="secondary" onClick={handleApplyFilters}>
                Apply Filters
              </Button>
            </div>
          </div>
        </div>

        {loading && <SkeletonList rows={4} />}

        {!loading && error && !needsProfile && (
          <div className="rounded-xl border border-[var(--ds-danger)]/40 bg-[var(--ds-danger-bg)] px-4 py-3 text-sm text-[var(--ds-danger)]">
            {error}
          </div>
        )}

        {!loading && needsProfile && (
          <EmptyState
            title="Complete your profile to get matches"
            description="The AI Job Agent needs your skills, education and resume to score jobs for you."
            ctaLabel="Go to Profile"
            ctaHref="/dashboard/intern/profile/edit"
          />
        )}

        {!loading && !error && jobs.length === 0 && (
          <EmptyState
            title="No matching jobs yet"
            description={
              sourceFilter
                ? `No current matches from ${JOB_AGENT_SOURCE_LABELS[sourceFilter as keyof typeof JOB_AGENT_SOURCE_LABELS] || sourceFilter}. Try "All sources", or check the Job Sources panel above for its sync status.`
                : "New jobs are discovered automatically. Check back soon, or widen your filters."
            }
          />
        )}

        {!loading && jobs.length > 0 && (
          <div className="space-y-3">
            {jobs.map((job) => {
              const concernsOpen = expandedConcernId === job.id;
              return (
                <div key={job.id} className="surface-subtle flex flex-col gap-3 px-4 py-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[0.95rem] font-semibold text-[var(--ds-text)]">{job.title}</p>
                      <p className="mt-0.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-[var(--ds-text-secondary)]">
                        <span className="font-medium">{job.companyName || "Company not listed"}</span>
                        {job.location && (
                          <span className="inline-flex items-center gap-1">
                            <AppIcon icon={MapPin} size="xs" />
                            {job.location}
                          </span>
                        )}
                        {job.workMode && (
                          <span className="inline-flex items-center gap-1">
                            <AppIcon icon={Briefcase} size="xs" />
                            {job.workMode}
                          </span>
                        )}
                        {postingAgeLabel(job.postedAt) && (
                          <span className="inline-flex items-center gap-1">
                            <AppIcon icon={Clock} size="xs" />
                            {postingAgeLabel(job.postedAt)}
                          </span>
                        )}
                        <Badge tone="neutral">{JOB_AGENT_SOURCE_LABELS[job.source] || job.source}</Badge>
                        {job.experienceLevelTag !== "unspecified" && (
                          <Badge tone="neutral">{JOB_AGENT_CATEGORY_LABELS[job.experienceLevelTag]}</Badge>
                        )}
                      </p>
                      {job.requiresAttribution && (
                        <p className="mt-0.5 text-[10px] text-[var(--ds-muted)]">
                          Listing via {JOB_AGENT_SOURCE_LABELS[job.source] || job.source}
                        </p>
                      )}
                    </div>
                    <Badge tone={fitScoreTone(job.fitScore)} icon={Sparkles} className="shrink-0">
                      {job.fitScore}% fit
                    </Badge>
                  </div>

                  <p className="text-sm leading-relaxed text-[var(--ds-text-secondary)]">{job.explanation}</p>

                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
                    {job.matchedRequiredSkills.length > 0 && (
                      <p className="text-[var(--ds-success)]">Matches: {job.matchedRequiredSkills.join(", ")}</p>
                    )}
                    {job.missingRequiredSkills.length > 0 && (
                      <p className="text-[var(--ds-muted)]">Missing: {job.missingRequiredSkills.join(", ")}</p>
                    )}
                  </div>

                  {job.eligibilityConcerns.length > 0 && (
                    <div>
                      <button
                        type="button"
                        onClick={() => setExpandedConcernId(concernsOpen ? null : job.id)}
                        className="inline-flex items-center gap-1 text-xs font-medium text-[var(--ds-warning)]"
                        aria-expanded={concernsOpen}
                      >
                        {job.eligibilityConcerns.length} eligibility {job.eligibilityConcerns.length === 1 ? "note" : "notes"}
                        <AppIcon icon={concernsOpen ? ChevronUp : ChevronDown} size="xs" className="text-[var(--ds-warning)]" />
                      </button>
                      {concernsOpen && (
                        <ul className="mt-1.5 list-inside list-disc space-y-0.5 text-xs text-[var(--ds-warning)]">
                          {job.eligibilityConcerns.map((concern, idx) => (
                            <li key={idx}>{concern}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}

                  <div className="flex gap-2 border-t border-[var(--ds-border)] pt-3">
                    <Button type="button" size="sm" variant="secondary" onClick={() => handleSaveJob(job)} disabled={savingJobId === job.id}>
                      Save to Tracker
                    </Button>
                    {isSafeExternalUrl(job.applyUrl) ? (
                      <a
                        href={job.applyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex h-9 items-center justify-center rounded-xl bg-[linear-gradient(135deg,var(--ds-gradient-from,#1f6fff),var(--ds-gradient-to,#22d3ee))] px-4 text-sm font-semibold text-[var(--ds-on-primary,#fff)] shadow-glow transition hover:brightness-110"
                      >
                        View / Apply
                      </a>
                    ) : job.isInternal ? (
                      <Link href="/dashboard/intern/internships/search" className="self-center text-xs text-[var(--ds-accent)] underline">
                        View on CareerSetu
                      </Link>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!loading && !error && jobs.length > 0 && totalPages > 1 && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--ds-border)] pt-4">
            <p className="text-xs text-[var(--ds-muted)]">
              Page {page} of {totalPages} &middot; {totalJobs} matching job{totalJobs === 1 ? "" : "s"}
            </p>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => handleGoToPage(page - 1)}
                disabled={page <= 1}
                aria-label="Previous page"
              >
                Previous
              </Button>
              <span className="text-xs text-[var(--ds-text-secondary)]">{page} / {totalPages}</span>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => handleGoToPage(page + 1)}
                disabled={page >= totalPages}
                aria-label="Next page"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </SectionPanel>
    </div>
  );
}
