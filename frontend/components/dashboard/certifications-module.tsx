"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Award,
  CheckCircle2,
  Clock3,
  Download,
  Eye,
  FileText,
  Plus,
  X,
  XCircle
} from "lucide-react";
import { AppIcon } from "@/components/icons/app-icon";
import { Button } from "@/components/ui/button";
import {
  CertificationRecord,
  CertificationStats,
  SKILL_CATEGORY_OPTIONS,
  certificationStatusLabel,
  fetchCertificateBlob,
  fetchMyCertifications,
  submitCertification
} from "@/lib/certifications-portal";
import { cn } from "@/lib/utils";

const card =
  "rounded-2xl border border-slate-200/40 bg-white/90 shadow-[0_4px_24px_-10px_rgba(15,23,42,0.08)] dark:border-slate-800/60 dark:bg-slate-900/60";

const STATUS_STYLES = {
  pending_verification: "bg-amber-50 text-amber-700 border-amber-200/70 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-900/40",
  verified: "bg-emerald-50 text-emerald-700 border-emerald-200/70 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-900/40",
  rejected: "bg-rose-50 text-rose-700 border-rose-200/70 dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-900/40"
} as const;

function StatTile({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className={cn(card, "px-4 py-4")}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900 dark:text-slate-50">{value}</p>
        </div>
        <div className="text-slate-400 dark:text-slate-500">{icon}</div>
      </div>
    </div>
  );
}

function formatDate(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

type PreviewState = {
  certificationId: string;
  courseName: string;
  mimeType: string;
  objectUrl: string;
};

export function CertificationsModule() {
  const [certifications, setCertifications] = useState<CertificationRecord[]>([]);
  const [stats, setStats] = useState<CertificationStats>({ total: 0, verified: 0, pending: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [preview, setPreview] = useState<PreviewState | null>(null);
  const [detailsId, setDetailsId] = useState<string | null>(null);

  const [form, setForm] = useState({
    courseName: "",
    skillCategory: SKILL_CATEGORY_OPTIONS[0] as string,
    provider: "",
    completionDate: "",
    credentialUrl: "",
    credentialId: "",
    description: ""
  });
  const [file, setFile] = useState<File | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchMyCertifications();
      setCertifications(data.certifications);
      setStats(data.stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load certifications");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    return () => {
      if (preview?.objectUrl) URL.revokeObjectURL(preview.objectUrl);
    };
  }, [preview]);

  const detailsItem = useMemo(
    () => certifications.find((item) => item._id === detailsId) || null,
    [certifications, detailsId]
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setError("Please upload your certificate file (PDF, PNG, or JPG).");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("courseName", form.courseName);
      formData.append("skillCategory", form.skillCategory);
      formData.append("provider", form.provider);
      formData.append("completionDate", form.completionDate);
      if (form.credentialUrl) formData.append("credentialUrl", form.credentialUrl);
      if (form.credentialId) formData.append("credentialId", form.credentialId);
      if (form.description) formData.append("description", form.description);
      formData.append("certificateFile", file);

      await submitCertification(formData);
      setShowForm(false);
      setForm({
        courseName: "",
        skillCategory: SKILL_CATEGORY_OPTIONS[0],
        provider: "",
        completionDate: "",
        credentialUrl: "",
        credentialId: "",
        description: ""
      });
      setFile(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  }

  async function openPreview(item: CertificationRecord) {
    try {
      const blob = await fetchCertificateBlob(item._id, false);
      if (preview?.objectUrl) URL.revokeObjectURL(preview.objectUrl);
      setPreview({
        certificationId: item._id,
        courseName: item.courseName,
        mimeType: item.certificateFile?.mimeType || blob.type,
        objectUrl: URL.createObjectURL(blob)
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not preview certificate");
    }
  }

  async function downloadCertificate(item: CertificationRecord) {
    try {
      const blob = await fetchCertificateBlob(item._id, true);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = item.certificateFile?.originalName || `${item.courseName}-certificate`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not download certificate");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Submit proof after completing a course. Certifications become Verified only after admin approval.
          </p>
        </div>
        <Button type="button" onClick={() => setShowForm((v) => !v)} className="inline-flex items-center gap-2">
          <AppIcon icon={Plus} size="xs" />
          Add Certification
        </Button>
      </div>

      {error ? (
        <div className="rounded-xl border border-rose-200/70 bg-rose-50/70 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/25 dark:text-rose-300">
          {error}
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Total" value={stats.total} icon={<AppIcon icon={Award} size="sm" />} />
        <StatTile label="Verified" value={stats.verified} icon={<AppIcon icon={CheckCircle2} size="sm" />} />
        <StatTile label="Pending" value={stats.pending} icon={<AppIcon icon={Clock3} size="sm" />} />
        <StatTile label="Rejected" value={stats.rejected} icon={<AppIcon icon={XCircle} size="sm" />} />
      </div>

      {showForm ? (
        <form onSubmit={handleSubmit} className={cn(card, "space-y-4 p-6")}>
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">Submit Certification Proof</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1 text-sm">
              <span className="font-medium text-slate-700 dark:text-slate-300">Course Name *</span>
              <input
                required
                className="ds-input w-full"
                value={form.courseName}
                onChange={(e) => setForm((f) => ({ ...f, courseName: e.target.value }))}
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-medium text-slate-700 dark:text-slate-300">Skill Category *</span>
              <select
                required
                className="ds-input ds-select w-full"
                value={form.skillCategory}
                onChange={(e) => setForm((f) => ({ ...f, skillCategory: e.target.value }))}
              >
                {SKILL_CATEGORY_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-medium text-slate-700 dark:text-slate-300">Provider *</span>
              <input
                required
                className="ds-input w-full"
                placeholder="Coursera, freeCodeCamp, NPTEL..."
                value={form.provider}
                onChange={(e) => setForm((f) => ({ ...f, provider: e.target.value }))}
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-medium text-slate-700 dark:text-slate-300">Completion Date *</span>
              <input
                required
                type="date"
                className="ds-input w-full"
                value={form.completionDate}
                onChange={(e) => setForm((f) => ({ ...f, completionDate: e.target.value }))}
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-medium text-slate-700 dark:text-slate-300">Credential URL</span>
              <input
                className="ds-input w-full"
                value={form.credentialUrl}
                onChange={(e) => setForm((f) => ({ ...f, credentialUrl: e.target.value }))}
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-medium text-slate-700 dark:text-slate-300">Credential ID</span>
              <input
                className="ds-input w-full"
                value={form.credentialId}
                onChange={(e) => setForm((f) => ({ ...f, credentialId: e.target.value }))}
              />
            </label>
          </div>
          <label className="block space-y-1 text-sm">
            <span className="font-medium text-slate-700 dark:text-slate-300">Description</span>
            <textarea
              className="ds-input min-h-[80px] w-full"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </label>
          <label className="block space-y-1 text-sm">
            <span className="font-medium text-slate-700 dark:text-slate-300">Certificate File * (PDF, PNG, JPG)</span>
            <input
              required
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
              className="ds-input w-full"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </label>
          <div className="flex gap-3">
            <Button type="submit" disabled={submitting}>
              {submitting ? "Submitting..." : "Submit for Verification"}
            </Button>
            <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
          </div>
        </form>
      ) : null}

      {loading ? (
        <div className="surface-muted px-4 py-6 text-sm text-slate-600 dark:text-slate-300">Loading certifications...</div>
      ) : certifications.length === 0 ? (
        <div className={cn(card, "px-6 py-10 text-center")}>
          <AppIcon icon={FileText} size="md" className="mx-auto text-sky-400" />
          <p className="mt-4 text-base font-medium text-slate-700 dark:text-slate-200">No certifications submitted yet</p>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Complete a course from your learning path, then upload proof here for verification.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {certifications.map((item) => (
            <article
              key={item._id}
              className={cn(
                card,
                "p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_28px_-12px_rgba(15,23,42,0.12)]"
              )}
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="text-base font-bold text-slate-900 dark:text-slate-50">{item.courseName}</h4>
                    <span
                      className={cn(
                        "rounded-md border px-2 py-0.5 text-xs font-semibold",
                        STATUS_STYLES[item.verificationStatus]
                      )}
                    >
                      {certificationStatusLabel(item.verificationStatus)}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    {item.provider} · {item.skillCategory}
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Completed {formatDate(item.completionDate)}</p>
                  {item.verificationStatus === "rejected" && item.rejectionReason ? (
                    <p className="text-sm text-rose-600 dark:text-rose-400">Reason: {item.rejectionReason}</p>
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" size="sm" variant="secondary" onClick={() => openPreview(item)}>
                    <AppIcon icon={Eye} size="xs" /> View
                  </Button>
                  <Button type="button" size="sm" variant="secondary" onClick={() => downloadCertificate(item)}>
                    <AppIcon icon={Download} size="xs" /> Download
                  </Button>
                  <Button type="button" size="sm" variant="secondary" onClick={() => setDetailsId(item._id)}>
                    Details
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {detailsItem ? (
        <div className={cn(card, "space-y-3 p-6")}>
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">Certification Details</h3>
            <button type="button" onClick={() => setDetailsId(null)} aria-label="Close details">
              <AppIcon icon={X} size="sm" />
            </button>
          </div>
          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            <div><dt className="text-slate-500">Course</dt><dd className="font-medium">{detailsItem.courseName}</dd></div>
            <div><dt className="text-slate-500">Provider</dt><dd className="font-medium">{detailsItem.provider}</dd></div>
            <div><dt className="text-slate-500">Category</dt><dd className="font-medium">{detailsItem.skillCategory}</dd></div>
            <div><dt className="text-slate-500">Status</dt><dd className="font-medium">{certificationStatusLabel(detailsItem.verificationStatus)}</dd></div>
            {detailsItem.credentialUrl ? <div className="sm:col-span-2"><dt className="text-slate-500">Credential URL</dt><dd className="break-all">{detailsItem.credentialUrl}</dd></div> : null}
            {detailsItem.credentialId ? <div><dt className="text-slate-500">Credential ID</dt><dd>{detailsItem.credentialId}</dd></div> : null}
            {detailsItem.description ? <div className="sm:col-span-2"><dt className="text-slate-500">Description</dt><dd>{detailsItem.description}</dd></div> : null}
          </dl>
        </div>
      ) : null}

      {preview ? (
        <div className={cn(card, "space-y-3 p-4")}>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Preview: {preview.courseName}</h3>
            <button
              type="button"
              onClick={() => {
                URL.revokeObjectURL(preview.objectUrl);
                setPreview(null);
              }}
              aria-label="Close preview"
            >
              <AppIcon icon={X} size="sm" />
            </button>
          </div>
          {preview.mimeType.includes("pdf") ? (
            <iframe title="Certificate preview" src={preview.objectUrl} className="h-[420px] w-full rounded-lg border border-slate-200 dark:border-slate-700" />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview.objectUrl} alt="Certificate preview" className="max-h-[420px] w-full rounded-lg object-contain" />
          )}
        </div>
      ) : null}
    </div>
  );
}
