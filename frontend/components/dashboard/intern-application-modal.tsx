"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
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
  const [isMounted, setIsMounted] = useState(false);

  const attachedResumeUrl = useMemo(() => buildAssetUrl(resumePath), [resumePath]);
  const attachedResumeName = useMemo(() => getResumeName(resumePath), [resumePath]);
  const requiredSkills = internship.skillsRequired || [];

  useEffect(() => {
    setIsMounted(true);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

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

  if (!isMounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[1000] bg-slate-900/45">
      <div className="flex h-full w-full items-start justify-center overflow-hidden px-4 pb-6 pt-6 md:pt-8">
        <div className="flex w-full max-w-[900px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_20px_55px_rgba(15,23,42,0.18)]" style={{ maxHeight: "88vh" }}>
          <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 md:px-6">
            <div className="min-w-0">
              <h3 className="text-xl font-semibold text-slate-900">Apply for Internship</h3>
              <p className="mt-1 truncate text-sm text-slate-600">
                {internship.role} • {internship.company?.companyName || "Company"}
              </p>
            </div>
            <button
              type="button"
              aria-label="Close modal"
              onClick={onClose}
              className="rounded-md border border-slate-200 px-2.5 py-1 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 active:scale-95"
            >
              ×
            </button>
          </header>

          <div className="flex-1 overflow-y-auto px-5 py-5 md:px-6">
            <div className="space-y-4 text-sm">
              <section className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                <p className="text-sm font-semibold text-slate-900">Internship Details</p>
                <p className="mt-2 text-xs font-medium uppercase tracking-wide text-slate-500">Job Description</p>
                <p className="mt-1.5 text-slate-700">{internship.description || "Not specified"}</p>
              </section>

              <section className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Roles & Responsibilities</p>
                <p className="mt-1.5 text-slate-700">{internship.responsibilities || "No prior experience required"}</p>
              </section>

              <section className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Required Skills</p>
                <p className="mt-1.5 text-slate-700">{requiredSkills.length > 0 ? requiredSkills.join(", ") : "Not specified"}</p>
              </section>

              <section className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Location & Work Mode</p>
                <p className="mt-1.5 text-slate-700">
                  {internship.location || "Not specified"} | {internship.mode || "Not specified"}
                </p>
                <p className="mt-1 text-xs text-slate-500">Stipend: {internship.stipend || "Not specified"}</p>
              </section>

              <section className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                <p className="text-sm font-semibold text-slate-900">Company Details</p>
                <p className="mt-2 text-slate-700">{internship.company?.description || "Not specified"}</p>
                <p className="mt-2 text-xs text-slate-500">
                  {internship.company?.website || "Website not specified"} | {internship.company?.address || "Address not specified"}
                </p>
              </section>

              <section className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                <p className="text-sm font-semibold text-slate-900">Attached Resume</p>
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
                <p className="mt-2 text-xs text-slate-500">Your resume from your profile will be submitted with this application.</p>
              </section>

              <section className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                <p className="text-sm font-semibold text-slate-900">Availability</p>
                <p className="mt-2 text-slate-700">Are you available to join immediately?</p>
                <div className="mt-3 flex flex-wrap gap-5 text-sm text-slate-700">
                  <label className="inline-flex cursor-pointer items-center gap-2">
                    <input type="radio" name="availability" checked={availabilityStatus === "yes"} onChange={() => setAvailabilityStatus("yes")} />
                    Yes
                  </label>
                  <label className="inline-flex cursor-pointer items-center gap-2">
                    <input type="radio" name="availability" checked={availabilityStatus === "no"} onChange={() => setAvailabilityStatus("no")} />
                    No
                  </label>
                </div>

                <div className={`grid transition-all duration-300 ease-out ${availabilityStatus === "no" ? "mt-4 grid-rows-[1fr] opacity-100" : "mt-0 grid-rows-[0fr] opacity-0"}`}>
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
              </section>

              {error && <p className="text-sm text-rose-700">{error}</p>}
            </div>
          </div>

          <footer className="flex items-center justify-between gap-3 border-t border-slate-200 bg-white px-5 py-4 md:px-6">
            <Button type="button" variant="secondary" onClick={onClose} disabled={submitting} className="transition hover:-translate-y-0.5 active:translate-y-0">
              Cancel
            </Button>
            <Button type="button" onClick={submitApplication} disabled={submitting} className="transition hover:-translate-y-0.5 active:translate-y-0">
              {submitting ? "Applying..." : "Apply Now"}
            </Button>
          </footer>
        </div>
      </div>
    </div>,
    document.body
  );
}
