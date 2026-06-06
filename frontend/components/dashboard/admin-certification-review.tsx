"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Download, Eye, XCircle } from "lucide-react";
import { AppIcon } from "@/components/icons/app-icon";
import { Button } from "@/components/ui/button";
import {
  CertificationRecord,
  certificationStatusLabel,
  fetchAdminCertificateBlob,
  fetchAdminCertifications,
  reviewAdminCertification
} from "@/lib/certifications-portal";
import { cn } from "@/lib/utils";

const card =
  "rounded-2xl border border-slate-200/40 bg-white/90 p-5 shadow-[0_4px_24px_-10px_rgba(15,23,42,0.08)] dark:border-slate-800/60 dark:bg-slate-900/60";

export function AdminCertificationReview() {
  const [items, setItems] = useState<CertificationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState<"pending_verification" | "verified" | "rejected" | "">(
    "pending_verification"
  );
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchAdminCertifications({
        status: statusFilter || undefined
      });
      setItems(data.certifications);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load certification queue");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  async function approve(item: CertificationRecord) {
    try {
      await reviewAdminCertification(item._id, { status: "verified" });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Approval failed");
    }
  }

  async function reject(item: CertificationRecord) {
    if (!rejectReason.trim()) {
      setError("Rejection reason is required.");
      return;
    }
    try {
      await reviewAdminCertification(item._id, { status: "rejected", rejectionReason: rejectReason.trim() });
      setRejectingId(null);
      setRejectReason("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Rejection failed");
    }
  }

  async function preview(item: CertificationRecord) {
    try {
      const blob = await fetchAdminCertificateBlob(item._id, false);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(URL.createObjectURL(blob));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not preview certificate");
    }
  }

  async function download(item: CertificationRecord) {
    try {
      const blob = await fetchAdminCertificateBlob(item._id, true);
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
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <select
          className="ds-input ds-select h-10"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
        >
          <option value="pending_verification">Pending Verification</option>
          <option value="verified">Verified</option>
          <option value="rejected">Rejected</option>
          <option value="">All</option>
        </select>
        <Button type="button" variant="secondary" onClick={load}>
          Refresh
        </Button>
      </div>

      {error ? (
        <div className="rounded-xl border border-rose-200/70 bg-rose-50/70 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/25 dark:text-rose-300">
          {error}
        </div>
      ) : null}

      {loading ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">Loading certification submissions...</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">No certifications in this queue.</p>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <article key={item._id} className={card}>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-1">
                  <h4 className="text-base font-bold text-slate-900 dark:text-slate-50">{item.courseName}</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    {item.internName || "Intern"} · {item.provider} · {item.skillCategory}
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Status: {certificationStatusLabel(item.verificationStatus)}
                  </p>
                  {item.credentialUrl ? <p className="text-xs break-all text-slate-500">{item.credentialUrl}</p> : null}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" size="sm" variant="secondary" onClick={() => preview(item)}>
                    <AppIcon icon={Eye} size="xs" /> Preview
                  </Button>
                  <Button type="button" size="sm" variant="secondary" onClick={() => download(item)}>
                    <AppIcon icon={Download} size="xs" /> Download
                  </Button>
                  {item.verificationStatus === "pending_verification" ? (
                    <>
                      <Button type="button" size="sm" onClick={() => approve(item)}>
                        <AppIcon icon={CheckCircle2} size="xs" /> Approve
                      </Button>
                      <Button type="button" size="sm" variant="secondary" onClick={() => setRejectingId(item._id)}>
                        <AppIcon icon={XCircle} size="xs" /> Reject
                      </Button>
                    </>
                  ) : null}
                </div>
              </div>
              {rejectingId === item._id ? (
                <div className="mt-4 space-y-2 border-t border-slate-200/60 pt-4 dark:border-slate-700/60">
                  <textarea
                    className="ds-input min-h-[72px] w-full"
                    placeholder="Rejection reason (required)"
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <Button type="button" size="sm" onClick={() => reject(item)}>
                      Confirm Reject
                    </Button>
                    <Button type="button" size="sm" variant="secondary" onClick={() => setRejectingId(null)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : null}
            </article>
          ))}
        </div>
      )}

      {previewUrl ? (
        <div className={cn(card)}>
          <iframe title="Admin certificate preview" src={previewUrl} className="h-[480px] w-full rounded-lg" />
        </div>
      ) : null}
    </div>
  );
}
