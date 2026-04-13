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
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/45">
      <div
        className="fixed left-1/2 top-1/2 w-[min(760px,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 transform overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-b from-white to-slate-50 shadow-[0_24px_70px_rgba(15,23,42,0.24)]"
        style={{ maxHeight: "90vh" }}
      >
        <div className="max-h-[90vh] overflow-y-auto">
          <div className="border-b border-slate-200 bg-white/90 px-6 py-5 backdrop-blur">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Apply for Internship</h3>
                <p className="mt-1 text-sm text-slate-600">{internship.role}</p>
              </div>
              <button
                type="button"
                aria-label="Close modal"
                onClick={onClose}
                className="rounded-md px-2 py-1 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 active:scale-95"
              >
                ×
              </button>
            </div>
          </div>

          <div className="space-y-6 px-6 py-6 text-sm">
            <section className="space-y-3">
              <h4 className="text-sm font-semibold tracking-wide text-slate-900">Internship Details</h4>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <p className="text-xs font-medium text-slate-500">Job Description</p>
                  <p className="mt-1.5 text-slate-700">{internship.description || "Not specified"}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <p className="text-xs font-medium text-slate-500">Roles & Responsibilities</p>
                  <p className="mt-1.5 text-slate-700">{internship.responsibilities || "No prior experience required"}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <p className="text-xs font-medium text-slate-500">Required Skills</p>
                  <p className="mt-1.5 text-slate-700">{(internship.skillsRequired || []).length > 0 ? internship.skillsRequired?.join(", ") : "Not specified"}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <p className="text-xs font-medium text-slate-500">Location & Work Mode</p>
                  <p className="mt-1.5 text-slate-700">
                    {internship.location || "Not specified"} | {internship.mode || "Not specified"}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">Stipend: {internship.stipend || "Not specified"}</p>
                </div>
              </div>
            </section>

            <section className="space-y-3">
              <h4 className="text-sm font-semibold tracking-wide text-slate-900">Company Details</h4>
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="text-base font-semibold text-slate-900">{internship.company?.companyName || "Company"}</p>
                <p className="mt-1.5 text-slate-700">{internship.company?.description || "Not specified"}</p>
                <p className="mt-2 text-xs text-slate-500">
                  {internship.company?.website || "Website not specified"} | {internship.company?.address || "Address not specified"}
                </p>
              </div>
            </section>

            <section className="space-y-3">
              <h4 className="text-sm font-semibold tracking-wide text-slate-900">Resume</h4>
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="text-xs font-medium text-slate-500">Attached Resume</p>
                {resumePath ? (
                  <p className="mt-1.5 text-slate-700">
                    {attachedResumeUrl ? (
                      <a href={attachedResumeUrl} target="_blank" rel="noreferrer" className="font-medium text-blue-700 transition hover:text-blue-800 hover:underline">
                        {attachedResumeName}
                      </a>
                    ) : (
                      attachedResumeName
                    )}
                  </p>
                ) : (
                  <p className="mt-1.5 text-rose-700">Please upload your resume in profile before applying.</p>
                )}
                <p className="mt-2 text-xs text-slate-500">Your resume from profile will be submitted with this application.</p>
              </div>
            </section>

            <section className="space-y-3">
              <h4 className="text-sm font-semibold tracking-wide text-slate-900">Availability</h4>
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="font-medium text-slate-900">Are you available to join immediately?</p>
                <div className="mt-3 flex gap-5 text-sm text-slate-700">
                  <label className="inline-flex cursor-pointer items-center gap-2">
                    <input type="radio" name="availability" checked={availabilityStatus === "yes"} onChange={() => setAvailabilityStatus("yes")} />
                    Yes
                  </label>
                  <label className="inline-flex cursor-pointer items-center gap-2">
                    <input type="radio" name="availability" checked={availabilityStatus === "no"} onChange={() => setAvailabilityStatus("no")} />
                    No
                  </label>
                </div>

                <div
                  className={`grid transition-all duration-300 ease-out ${availabilityStatus === "no" ? "mt-4 grid-rows-[1fr] opacity-100" : "mt-0 grid-rows-[0fr] opacity-0"}`}
                >
                  <div className="overflow-hidden">
                    <label className="text-sm font-medium text-slate-900" htmlFor="joiningDate">
                      Available From
                    </label>
                    <input
                      id="joiningDate"
                      type="date"
                      value={joiningDate}
                      min={new Date().toISOString().split("T")[0]}
                      onChange={(event) => setJoiningDate(event.target.value)}
                      className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
                    />
                  </div>
                </div>
              </div>
            </section>

            {error && <p className="text-sm text-rose-700">{error}</p>}
          </div>
        </div>

        <div className="sticky bottom-0 flex justify-end gap-2 border-t border-slate-200 bg-white/95 px-6 py-4 backdrop-blur">
          <Button type="button" variant="secondary" onClick={onClose} disabled={submitting} className="transition hover:-translate-y-0.5 active:translate-y-0">
            Cancel
          </Button>
          <Button type="button" onClick={submitApplication} disabled={submitting} className="transition hover:-translate-y-0.5 active:translate-y-0">
            {submitting ? "Applying..." : "Apply Now"}
          </Button>
        </div>
      </div>
    </div>
  );
}
