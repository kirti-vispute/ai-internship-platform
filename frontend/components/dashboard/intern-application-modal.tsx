"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { InternshipListing, applyToInternship, buildAssetUrl } from "@/lib/intern-portal";

type Props = {
  internship: InternshipListing;
  resumePath: string;
  onClose: () => void;
  onSuccess: () => void;
};

function getResumeName(pathValue: string) {
  const parts = String(pathValue || "").split(/[\\/]/).filter(Boolean);
  return parts[parts.length - 1] || "resume";
}

export function InternApplicationModal({ internship, resumePath, onClose, onSuccess }: Props) {
  const [availabilityStatus, setAvailabilityStatus] = useState<"yes" | "no">("yes");
  const [joiningDate, setJoiningDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const attachedResumeUrl = useMemo(() => buildAssetUrl(resumePath), [resumePath]);
  const attachedResumeName = useMemo(() => getResumeName(resumePath), [resumePath]);

  async function submitApplication() {
    try {
      setError(null);
      if (!resumePath) {
        setError("Please upload your resume in profile before applying.");
        return;
      }
      if (availabilityStatus === "no" && !joiningDate) {
        setError("Please select when you can join.");
        return;
      }

      setSubmitting(true);
      await applyToInternship(internship._id, {
        availabilityStatus,
        joiningDate: availabilityStatus === "no" ? joiningDate : null
      });
      onSuccess();
    } catch (err) {
      setError((err as Error).message || "Failed to submit application.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Apply for Internship</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300">{internship.role}</p>
          </div>
          <Button type="button" size="sm" variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>

        <div className="mt-4 grid gap-2 text-sm">
          <div className="surface-subtle px-3 py-2">
            <p className="text-xs uppercase tracking-wide text-slate-500">Company</p>
            <p className="font-semibold text-slate-900 dark:text-slate-100">{internship.company?.companyName || "Company"}</p>
          </div>
          <div className="surface-subtle px-3 py-2">
            <p className="text-xs uppercase tracking-wide text-slate-500">Company Details</p>
            <p className="text-slate-700 dark:text-slate-300">{internship.company?.description || "Not specified"}</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {internship.company?.website || "Website not specified"} | {internship.company?.address || "Address not specified"}
            </p>
          </div>
          <div className="surface-subtle px-3 py-2">
            <p className="text-xs uppercase tracking-wide text-slate-500">Job Description</p>
            <p className="text-slate-700 dark:text-slate-300">{internship.description || "Not specified"}</p>
          </div>
          <div className="surface-subtle px-3 py-2">
            <p className="text-xs uppercase tracking-wide text-slate-500">Role / Responsibilities</p>
            <p className="text-slate-700 dark:text-slate-300">{internship.responsibilities || internship.description || "Not specified"}</p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="surface-subtle px-3 py-2">
              <p className="text-xs uppercase tracking-wide text-slate-500">Required Skills</p>
              <p className="text-slate-700 dark:text-slate-300">
                {(internship.skillsRequired || []).length > 0 ? internship.skillsRequired?.join(", ") : "Not specified"}
              </p>
            </div>
            <div className="surface-subtle px-3 py-2">
              <p className="text-xs uppercase tracking-wide text-slate-500">Location / Mode</p>
              <p className="text-slate-700 dark:text-slate-300">{internship.location || "Not specified"} | {internship.mode || "Not specified"}</p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Stipend: {internship.stipend || "Not specified"}</p>
            </div>
          </div>
          <div className="surface-subtle px-3 py-2">
            <p className="text-xs uppercase tracking-wide text-slate-500">Attached Resume</p>
            {resumePath ? (
              <p className="text-slate-700 dark:text-slate-300">
                {attachedResumeUrl ? (
                  <a href={attachedResumeUrl} target="_blank" rel="noreferrer" className="text-blue-700 hover:underline dark:text-blue-300">
                    {attachedResumeName}
                  </a>
                ) : (
                  attachedResumeName
                )}
              </p>
            ) : (
              <p className="text-rose-700 dark:text-rose-300">Please upload your resume in profile before applying.</p>
            )}
          </div>
        </div>

        <div className="mt-4 space-y-3">
          <div>
            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Are you available to join now?</p>
            <div className="mt-2 flex gap-4 text-sm text-slate-700 dark:text-slate-300">
              <label className="inline-flex items-center gap-2">
                <input type="radio" name="availability" checked={availabilityStatus === "yes"} onChange={() => setAvailabilityStatus("yes")} />
                Yes
              </label>
              <label className="inline-flex items-center gap-2">
                <input type="radio" name="availability" checked={availabilityStatus === "no"} onChange={() => setAvailabilityStatus("no")} />
                No
              </label>
            </div>
          </div>

          {availabilityStatus === "no" && (
            <div>
              <label className="text-sm font-medium text-slate-900 dark:text-slate-100" htmlFor="joiningDate">
                When can you join?
              </label>
              <input
                id="joiningDate"
                type="date"
                value={joiningDate}
                min={new Date().toISOString().split("T")[0]}
                onChange={(event) => setJoiningDate(event.target.value)}
                className="surface-subtle mt-1 w-full px-3 py-2 text-sm"
              />
            </div>
          )}

          {error && <p className="text-sm text-rose-700 dark:text-rose-300">{error}</p>}
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="button" onClick={submitApplication} disabled={submitting}>
            {submitting ? "Submitting..." : "Submit Application"}
          </Button>
        </div>
      </div>
    </div>
  );
}
