"use client";

import { useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";
import { SectionPanel } from "@/components/dashboard/shared/section-panel";
import { EmptyState } from "@/components/dashboard/shared/empty-state";
import { SkeletonList } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { AppIcon } from "@/components/icons/app-icon";
import { JobAgentMaterialsWorkspace } from "@/components/dashboard/intern/job-agent-materials-workspace";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import {
  JobAgentApplication,
  JobAgentApplicationStatus,
  deleteJobAgentApplication,
  fetchJobAgentApplications,
  generateJobAgentMaterials,
  updateJobAgentApplication,
  updateJobAgentMaterials
} from "@/lib/job-agent-portal";

const STATUS_OPTIONS: JobAgentApplicationStatus[] = ["saved", "interested", "applied", "interview", "rejected"];

const STATUS_TONE: Record<JobAgentApplicationStatus, BadgeTone> = {
  saved: "neutral",
  interested: "info",
  applied: "accent",
  interview: "success",
  rejected: "danger"
};

export default function JobAgentTrackerPage() {
  const { pushToast } = useToast();
  const [applications, setApplications] = useState<JobAgentApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<JobAgentApplicationStatus | "">("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [draftResume, setDraftResume] = useState<Record<string, string>>({});
  const [draftCoverLetter, setDraftCoverLetter] = useState<Record<string, string>>({});
  // Holds the application pending a regenerate-confirmation -- only set
  // when materials already exist, so regenerating never silently discards
  // a candidate's (or their own prior) edits without an explicit confirm.
  const [pendingRegenerate, setPendingRegenerate] = useState<JobAgentApplication | null>(null);

  async function load() {
    try {
      setError(null);
      const items = await fetchJobAgentApplications(statusFilter || undefined);
      setApplications(items);
    } catch (e) {
      setError((e as Error).message || "Failed to load your application tracker.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setLoading(true);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  async function handleStatusChange(application: JobAgentApplication, status: JobAgentApplicationStatus) {
    setBusyId(application._id);
    try {
      const updated = await updateJobAgentApplication(application._id, { status });
      setApplications((prev) => prev.map((a) => (a._id === updated._id ? updated : a)));
    } catch (e) {
      pushToast({ title: "Couldn't update status", message: (e as Error).message, variant: "error" });
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(application: JobAgentApplication) {
    setBusyId(application._id);
    try {
      await deleteJobAgentApplication(application._id);
      setApplications((prev) => prev.filter((a) => a._id !== application._id));
      pushToast({ title: "Removed from tracker", variant: "success" });
    } catch (e) {
      pushToast({ title: "Couldn't remove", message: (e as Error).message, variant: "error" });
    } finally {
      setBusyId(null);
    }
  }

  async function handleGenerateMaterials(application: JobAgentApplication) {
    setBusyId(application._id);
    try {
      const updated = await generateJobAgentMaterials(application._id);
      setApplications((prev) => prev.map((a) => (a._id === updated._id ? updated : a)));
      setDraftResume((d) => ({ ...d, [updated._id]: updated.tailoredResume.content }));
      setDraftCoverLetter((d) => ({ ...d, [updated._id]: updated.coverLetter.content }));
      setExpandedId(updated._id);
      pushToast({ title: "Materials generated — review before using them", variant: "success" });
    } catch (e) {
      pushToast({ title: "Couldn't generate materials", message: (e as Error).message, variant: "error" });
    } finally {
      setBusyId(null);
    }
  }

  // "Generate" (no content yet) runs immediately; "Regenerate" (content
  // already exists -- possibly including the candidate's own saved edits)
  // always asks first, so a regeneration can never silently overwrite
  // something they already reviewed, edited and saved.
  function handleGenerateOrConfirmClick(application: JobAgentApplication) {
    if (application.tailoredResume?.content || application.coverLetter?.content) {
      setPendingRegenerate(application);
    } else {
      handleGenerateMaterials(application);
    }
  }

  async function handleConfirmRegenerate() {
    if (!pendingRegenerate) return;
    const application = pendingRegenerate;
    setPendingRegenerate(null);
    await handleGenerateMaterials(application);
  }

  async function handleSaveMaterials(application: JobAgentApplication) {
    setBusyId(application._id);
    try {
      const updated = await updateJobAgentMaterials(application._id, {
        tailoredResumeContent: draftResume[application._id],
        coverLetterContent: draftCoverLetter[application._id]
      });
      setApplications((prev) => prev.map((a) => (a._id === updated._id ? updated : a)));
      pushToast({ title: "Your edits were saved", variant: "success" });
    } catch (e) {
      pushToast({ title: "Couldn't save edits", message: (e as Error).message, variant: "error" });
    } finally {
      setBusyId(null);
    }
  }

  // Counts are only knowable for tabs matching the currently-loaded list
  // (the API returns one status at a time) -- shown only while "All" is
  // selected, where that list genuinely covers every status.
  const countsByStatus =
    statusFilter === ""
      ? applications.reduce<Partial<Record<JobAgentApplicationStatus, number>>>((acc, a) => {
          acc[a.status] = (acc[a.status] || 0) + 1;
          return acc;
        }, {})
      : null;

  return (
    <>
    <SectionPanel title="Application Tracker" subtitle="Everything you've saved or applied to, in one place.">
      <div
        aria-label="Filter by status"
        className="mb-4 flex flex-wrap gap-1.5 rounded-xl border border-[var(--ds-border)] bg-[var(--ds-surface-raised)] p-1.5"
      >
        <button
          type="button"
          aria-pressed={statusFilter === ""}
          onClick={() => setStatusFilter("")}
          className={cn(
            "rounded-lg px-3 py-1.5 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-focus-ring)]",
            statusFilter === "" ? "bg-[var(--ds-surface)] text-[var(--ds-text)] shadow-sm" : "text-[var(--ds-muted)] hover:text-[var(--ds-text)]"
          )}
        >
          All
          {countsByStatus && <span aria-hidden="true"> ({applications.length})</span>}
        </button>
        {STATUS_OPTIONS.map((s) => (
          <button
            key={s}
            type="button"
            aria-pressed={statusFilter === s}
            onClick={() => setStatusFilter(s)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-focus-ring)]",
              statusFilter === s ? "bg-[var(--ds-surface)] text-[var(--ds-text)] shadow-sm" : "text-[var(--ds-muted)] hover:text-[var(--ds-text)]"
            )}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
            {countsByStatus?.[s] ? <span aria-hidden="true"> ({countsByStatus[s]})</span> : null}
          </button>
        ))}
      </div>

      {loading && <SkeletonList rows={4} />}

      {!loading && error && (
        <div className="rounded-xl border border-[var(--ds-danger)]/40 bg-[var(--ds-danger-bg)] px-4 py-3 text-sm text-[var(--ds-danger)]">
          {error}
        </div>
      )}

      {!loading && !error && applications.length === 0 && (
        <EmptyState
          title="No tracked jobs yet"
          description="Save jobs from the AI Job Agent dashboard to track their status here."
          ctaLabel="Browse Job Matches"
          ctaHref="/dashboard/intern/job-agent"
        />
      )}

      {!loading && applications.length > 0 && (
        <div className="space-y-3">
          {applications.map((application) => {
            const isExpanded = expandedId === application._id;
            const isBusy = busyId === application._id;
            return (
              <div key={application._id} className="surface-subtle px-4 py-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-semibold text-[var(--ds-text)]">{application.snapshot?.title || "Untitled role"}</p>
                      {application.fitScore != null && <Badge tone="info">{application.fitScore}% fit</Badge>}
                    </div>
                    <p className="text-xs text-[var(--ds-text-secondary)]">
                      {application.snapshot?.companyName || "Company not listed"} {application.snapshot?.location ? `· ${application.snapshot.location}` : ""}
                    </p>
                  </div>

                  {/* Primary action: status, the thing changed most often. */}
                  <div className="flex items-center gap-2">
                    <Badge tone={STATUS_TONE[application.status]}>{application.status}</Badge>
                    <select
                      aria-label={`Change status for ${application.snapshot?.title || "this application"}`}
                      className="rounded-lg border border-[var(--ds-border)] bg-[var(--ds-surface)] px-2 py-1.5 text-xs text-[var(--ds-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-focus-ring)]"
                      value={application.status}
                      disabled={isBusy}
                      onChange={(e) => handleStatusChange(application, e.target.value as JobAgentApplicationStatus)}
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {s.charAt(0).toUpperCase() + s.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Secondary actions: grouped and understated, separated from
                    the primary status control by a divider so the card
                    doesn't read as one undifferentiated row of buttons. */}
                <div className="mt-3 flex flex-wrap items-center gap-x-1 gap-y-2 border-t border-[var(--ds-border)] pt-2.5">
                  {application.snapshot?.applyUrl && (
                    <a
                      href={application.snapshot.applyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium text-[var(--ds-text-secondary)] hover:bg-[var(--ds-hover)] hover:text-[var(--ds-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-focus-ring)]"
                    >
                      <AppIcon icon={ExternalLink} size="xs" />
                      Open Listing
                    </a>
                  )}
                  <Button type="button" size="sm" variant="ghost" disabled={isBusy} onClick={() => handleGenerateOrConfirmClick(application)}>
                    {application.tailoredResume?.content ? "Regenerate Materials" : "Generate Materials"}
                  </Button>
                  {application.tailoredResume?.content && (
                    <Button type="button" size="sm" variant="ghost" onClick={() => setExpandedId(isExpanded ? null : application._id)}>
                      {isExpanded ? "Hide Materials" : "View Materials"}
                    </Button>
                  )}
                  <span className="mx-1 h-4 w-px bg-[var(--ds-border)]" aria-hidden />
                  <Button type="button" size="sm" variant="ghost" disabled={isBusy} onClick={() => handleDelete(application)}>
                    Remove
                  </Button>
                </div>

                {isExpanded && (
                  <JobAgentMaterialsWorkspace
                    tailoredResumeContent={application.tailoredResume.content}
                    tailoredResumeSource={application.tailoredResume?.source}
                    coverLetterContent={application.coverLetter.content}
                    coverLetterSource={application.coverLetter?.source}
                    draftResume={draftResume[application._id] ?? application.tailoredResume.content}
                    draftCoverLetter={draftCoverLetter[application._id] ?? application.coverLetter.content}
                    onDraftResumeChange={(value) => setDraftResume((d) => ({ ...d, [application._id]: value }))}
                    onDraftCoverLetterChange={(value) => setDraftCoverLetter((d) => ({ ...d, [application._id]: value }))}
                    onSave={() => handleSaveMaterials(application)}
                    saving={isBusy}
                  />
                )}

                {application.notes && <p className="mt-2 text-xs text-[var(--ds-muted)]">Notes: {application.notes}</p>}
              </div>
            );
          })}
        </div>
      )}
    </SectionPanel>
    <ConfirmDialog
      open={Boolean(pendingRegenerate)}
      title="Regenerate application materials?"
      description="This will replace the current resume highlights and cover letter, including any edits you've saved, with a freshly generated version."
      confirmLabel="Regenerate"
      cancelLabel="Keep current"
      tone="default"
      busy={busyId === pendingRegenerate?._id}
      onConfirm={handleConfirmRegenerate}
      onCancel={() => setPendingRegenerate(null)}
    />
    </>
  );
}
