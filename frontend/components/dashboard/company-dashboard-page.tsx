"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CompanyShell } from "@/components/dashboard/company-shell";
import { SectionPanel } from "@/components/dashboard/section-panel";
import { SummaryStatCard } from "@/components/dashboard/summary-stat-card";
import { Button } from "@/components/ui/button";
import { RoleDashboardGuard } from "@/components/ui/role-dashboard-guard";
import { clearAuthSession } from "@/lib/session";
import {
  CompanyApplication,
  CompanyInternship,
  CompanyMatchedCandidate,
  CompanyProfile,
  fetchCompanyApplications,
  fetchCompanyInternships,
  fetchCompanyMatchedCandidates,
  fetchCompanyProfile,
  openCompanyApplicationResume,
  deleteCompanyInternship,
  postCompanyInternship,
  scheduleInterviewRound,
  updateCompanyApplicationStage,
  updateInterviewRound,
  updateCompanyProfile,
  searchCandidates,
  CandidateSearchResult
} from "@/lib/company-portal";
import { ApplicantDetailsModal, type InterviewFormState } from "@/components/dashboard/applicant-details-modal";

export type CompanyDashboardView =
  | "overview"
  | "profile"
  | "profile-edit"
  | "verification"
  | "hiring-post"
  | "hiring-active"
  | "hiring-applicants"
  | "hiring-shortlisted"
  | "hiring-pipeline"
  | "matching-ai"
  | "matching-search"
  | "matching-saved"
  | "reports-feedback"
  | "reports-notes"
  | "reports-export";

const WITH_INTERNSHIPS = new Set<CompanyDashboardView>([
  "overview",
  "hiring-post",
  "hiring-active",
  "hiring-applicants",
  "hiring-shortlisted",
  "hiring-pipeline",
  "matching-ai",
  "reports-feedback",
  "reports-notes",
  "reports-export"
]);
const WITH_APPS = new Set<CompanyDashboardView>([
  "overview",
  "hiring-applicants",
  "hiring-shortlisted",
  "hiring-pipeline",
  "reports-feedback",
  "reports-notes",
  "reports-export"
]);
const WITH_MATCHES = new Set<CompanyDashboardView>(["overview", "matching-ai"]);

const field = "surface-subtle px-3 py-2 text-sm";

function Empty({ text }: { text: string }) {
  return <div className="surface-subtle px-4 py-3 text-sm text-slate-600 dark:text-slate-300">{text}</div>;
}

function fmtDate(value?: string) {
  if (!value) return "-";
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return "-";
  return dt.toLocaleDateString();
}

function fmtAppliedDateTime(value?: string) {
  if (!value) return "-";
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return "-";
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const d = dt.getDate();
  const m = months[dt.getMonth()];
  const y = dt.getFullYear();
  let h = dt.getHours();
  const min = dt.getMinutes().toString().padStart(2, "0");
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${d} ${m} ${y}, ${h}:${min} ${ampm}`;
}

const DEFAULT_INTERVIEW_FORM: InterviewFormState = {
  roundType: "",
  interviewDate: "",
  interviewTime: "",
  mode: "online",
  meetingLink: "",
  location: "",
  notes: ""
};

const PIPELINE_STAGES = ["applied", "reviewed", "shortlisted", "interview", "selected", "rejected"] as const;

function normalizePipelineStatus(status: string) {
  const value = String(status || "").toLowerCase();
  if (value === "screening") return "reviewed";
  if (value === "offered") return "selected";
  return value;
}

function normalizeApplicantStage(value: string) {
  const normalized = String(value || "").toLowerCase();
  if (normalized === "screening") return "reviewed";
  if (normalized === "interview") return "interview_scheduled";
  if (normalized === "offered") return "selected";
  return normalized;
}

export function CompanyDashboardPage({ view }: { view: CompanyDashboardView }) {
  const router = useRouter();
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [internships, setInternships] = useState<CompanyInternship[]>([]);
  const [apps, setApps] = useState<CompanyApplication[]>([]);
  const [matches, setMatches] = useState<CompanyMatchedCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [searchResults, setSearchResults] = useState<CandidateSearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [detailResumeError, setDetailResumeError] = useState<string | null>(null);
  const [applicantDetailId, setApplicantDetailId] = useState<string | null>(null);
  const [interviewForms, setInterviewForms] = useState<Record<string, InterviewFormState>>({});
  const [statusDrafts, setStatusDrafts] = useState<Record<string, string>>({});

  const [profileForm, setProfileForm] = useState({ companyName: "", contactName: "", phone: "", website: "", address: "", description: "" });
  const [postForm, setPostForm] = useState({
    role: "",
    department: "",
    internshipType: "",
    mode: "",
    location: "",
    duration: "",
    startDate: "",
    applicationDeadline: "",
    stipend: "",
    perks: "",
    openings: "",
    skillsRequired: "",
    prioritySkills: "",
    description: "",
    responsibilities: "",
    eligibilityCriteria: "",
    educationQualification: "",
    degreePreferences: "",
    minimumCgpa: "",
    experienceRequirement: "",
    selectionProcess: "",
    interviewRoundsInfo: "",
    additionalInstructions: "",
    hrContact: ""
  });

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError(null);
        setSuccess(null);
        const p = await fetchCompanyProfile();
        setProfile(p);
        if (WITH_INTERNSHIPS.has(view)) setInternships(await fetchCompanyInternships());
        else setInternships([]);
        if (WITH_APPS.has(view)) setApps(await fetchCompanyApplications());
        else setApps([]);
        if (WITH_MATCHES.has(view)) setMatches(await fetchCompanyMatchedCandidates());
        else setMatches([]);
      } catch (e) {
        setError((e as Error).message || "Failed to load company data.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [view]);

  useEffect(() => {
    if (!profile) return;
    setProfileForm({
      companyName: profile.companyName || "",
      contactName: profile.contactName || "",
      phone: profile.phone || "",
      website: profile.website || "",
      address: profile.address || "",
      description: profile.description || ""
    });
  }, [profile]);

  useEffect(() => {
    if (view !== "matching-search") return;
    const timer = window.setTimeout(() => setDebouncedQuery(query.trim()), 350);
    return () => window.clearTimeout(timer);
  }, [query, view]);

  useEffect(() => {
    if (view !== "matching-search") return;

    if (!debouncedQuery) {
      setSearchResults([]);
      setSearchError(null);
      setSearchLoading(false);
      return;
    }

    let cancelled = false;
    setSearchLoading(true);
    setSearchError(null);

    searchCandidates(debouncedQuery)
      .then((results) => {
        if (!cancelled) setSearchResults(results);
      })
      .catch((e) => {
        if (!cancelled) {
          setSearchResults([]);
          setSearchError((e as Error).message || "Failed to search candidates.");
        }
      })
      .finally(() => {
        if (!cancelled) setSearchLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, view]);

  function logout() {
    clearAuthSession();
    router.push("/auth/company");
  }

  const shortlisted = useMemo(() => apps.filter((a) => normalizePipelineStatus(a.status) === "shortlisted"), [apps]);
  const detailApp = useMemo(
    () => (applicantDetailId ? apps.find((application) => application._id === applicantDetailId) ?? null : null),
    [apps, applicantDetailId]
  );

  useEffect(() => {
    if (view !== "hiring-applicants" && view !== "hiring-shortlisted") {
      setApplicantDetailId(null);
      setDetailResumeError(null);
    }
  }, [view]);

  useEffect(() => {
    if (applicantDetailId && !detailApp) setApplicantDetailId(null);
  }, [applicantDetailId, detailApp]);

  const statusCounts = useMemo(() => {
    const base: Record<string, number> = { applied: 0, reviewed: 0, shortlisted: 0, interview: 0, selected: 0, rejected: 0 };
    apps.forEach((a) => {
      const normalized = normalizePipelineStatus(a.status);
      base[normalized] = (base[normalized] || 0) + 1;
    });
    return base;
  }, [apps]);

  const summary = useMemo(
    () => ({
      verification: profile?.verificationStatus || "pending",
      activeInternships: internships.filter((item) => item.isActive).length,
      applicants: apps.length,
      shortlisted: shortlisted.length,
      matched: matches.length
    }),
    [profile?.verificationStatus, internships, apps.length, shortlisted.length, matches.length]
  );

  async function saveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      setSaving(true);
      setError(null);
      const updated = await updateCompanyProfile(profileForm);
      setProfile(updated);
      setSuccess("Company profile updated.");
    } catch (e) {
      setError((e as Error).message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  }

  async function createInternship(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!postForm.role.trim() || !postForm.description.trim()) {
      setError("Role and description are required.");
      return;
    }
    try {
      setSaving(true);
      setError(null);
      const toList = (v: string) => v.split(",").map((s) => s.trim()).filter(Boolean);
      await postCompanyInternship({
        role: postForm.role.trim(),
        description: postForm.description.trim(),
        skillsRequired: toList(postForm.skillsRequired),
        prioritySkills: toList(postForm.prioritySkills),
        stipend: postForm.stipend,
        perks: postForm.perks,
        openings: Number(postForm.openings) || undefined,
        duration: postForm.duration,
        location: postForm.location,
        internshipType: postForm.internshipType,
        department: postForm.department,
        startDate: postForm.startDate,
        applicationDeadline: postForm.applicationDeadline,
        mode: postForm.mode,
        responsibilities: postForm.responsibilities,
        eligibilityCriteria: postForm.eligibilityCriteria,
        educationQualification: postForm.educationQualification,
        degreePreferences: postForm.degreePreferences,
        minimumCgpa: postForm.minimumCgpa,
        experienceRequirement: postForm.experienceRequirement,
        selectionProcess: postForm.selectionProcess,
        interviewRoundsInfo: postForm.interviewRoundsInfo,
        additionalInstructions: postForm.additionalInstructions,
        hrContact: postForm.hrContact
      });
      setInternships(await fetchCompanyInternships(true));
      setSuccess("Internship posted successfully.");
      setPostForm({
        role: "", department: "", internshipType: "", mode: "", location: "", duration: "", startDate: "", applicationDeadline: "",
        stipend: "", perks: "", openings: "", skillsRequired: "", prioritySkills: "", description: "", responsibilities: "",
        eligibilityCriteria: "", educationQualification: "", degreePreferences: "", minimumCgpa: "", experienceRequirement: "",
        selectionProcess: "", interviewRoundsInfo: "", additionalInstructions: "", hrContact: ""
      });
    } catch (e) {
      setError((e as Error).message || "Failed to post internship.");
    } finally {
      setSaving(false);
    }
  }

  async function removeInternship(internshipId: string) {
    const confirmed = window.confirm("Are you sure you want to delete this internship?");
    if (!confirmed) return;
    try {
      setSaving(true);
      setError(null);
      await deleteCompanyInternship(internshipId);
      setInternships((prev) => prev.filter((item) => item._id !== internshipId));
      setApps(await fetchCompanyApplications(true));
      setSuccess("Internship deleted successfully.");
    } catch (e) {
      setError((e as Error).message || "Failed to delete internship.");
    } finally {
      setSaving(false);
    }
  }

  async function applyStage(applicationId: string, status: string, note = "") {
    try {
      setSaving(true);
      setError(null);
      await updateCompanyApplicationStage(applicationId, status, note);
      setApps(await fetchCompanyApplications(true));
      setSuccess("Applicant status updated.");
    } catch (e) {
      setError((e as Error).message || "Failed to update applicant stage.");
    } finally {
      setSaving(false);
    }
  }

  async function createInterviewRound(applicationId: string) {
    const form = interviewForms[applicationId];
    if (!form?.roundType || !form?.interviewDate || !form?.interviewTime) {
      setError("Interview round type, date and time are required.");
      return;
    }
    try {
      setSaving(true);
      setError(null);
      await scheduleInterviewRound(applicationId, form);
      setApps(await fetchCompanyApplications(true));
      setSuccess("Interview round scheduled.");
    } catch (e) {
      setError((e as Error).message || "Failed to schedule interview round.");
    } finally {
      setSaving(false);
    }
  }

  async function updateRoundStatus(applicationId: string, roundId: string, status: "scheduled" | "completed" | "cleared" | "rejected") {
    try {
      setSaving(true);
      setError(null);
      await updateInterviewRound(applicationId, roundId, { status });
      setApps(await fetchCompanyApplications(true));
      setSuccess("Interview round updated.");
    } catch (e) {
      setError((e as Error).message || "Failed to update interview round.");
    } finally {
      setSaving(false);
    }
  }

  function exportCsv() {
    const rows = [["candidate", "email", "internship", "status", "relevanceScore", "createdAt"]];
    apps.forEach((a) => rows.push([a.intern?.fullName || "", a.intern?.email || "", a.internship?.role || "", a.status || "", String(a.relevanceScore ?? a.matchScore ?? 0), a.createdAt || ""]));
    const csv = rows
      .map((row) => row.map((item) => (item.includes(",") || item.includes("\n") || item.includes('"') ? `"${item.replace(/"/g, '""')}"` : item)).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `company-report-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function applicantPanel(list: CompanyApplication[], title: string, subtitle: string, emptyText: string) {
    return (
      <SectionPanel title={title} subtitle={subtitle}>
        {list.length === 0 ? (
          <Empty text={emptyText} />
        ) : (
          <div className="space-y-3">
            {list.map((a) => {
              const matchPct = a.relevanceScore ?? a.matchScore ?? 0;
              const resumeScore = a.intern?.resume?.score ?? 0;
              return (
                <div
                  key={a._id}
                  className="surface-subtle flex flex-col gap-4 rounded-xl border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-700"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-base font-semibold text-slate-900 dark:text-slate-100">{a.intern?.fullName || "Candidate"}</p>
                    <p className="mt-0.5 truncate text-xs text-slate-600 dark:text-slate-300">{a.internship?.role || "Internship"}</p>
                  </div>
                  <div className="flex w-full flex-col items-stretch gap-3 sm:w-auto sm:items-end">
                    <p className="text-right text-xs text-slate-500 dark:text-slate-400">
                      Applied: <span className="font-medium text-slate-700 dark:text-slate-200">{fmtAppliedDateTime(a.createdAt)}</span>
                    </p>
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      <span className="inline-flex rounded-full bg-primary-100 px-2.5 py-1 text-xs font-semibold text-primary-800 dark:bg-primary-900/40 dark:text-primary-200">
                        Match {matchPct}%
                      </span>
                      <span className="inline-flex rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-800 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100">
                        Resume {resumeScore}
                      </span>
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        className="shrink-0 border-primary-300/60 text-primary-800 hover:bg-primary-50 dark:border-primary-700/50 dark:text-primary-200 dark:hover:bg-primary-950/40"
                        onClick={() => {
                          setApplicantDetailId(a._id);
                          setDetailResumeError(null);
                          setStatusDrafts((prev) => ({ ...prev, [a._id]: normalizeApplicantStage(a.status) }));
                        }}
                      >
                        View details
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </SectionPanel>
    );
  }

  const viewNode: React.ReactNode = (() => {
    switch (view) {
      case "overview":
        return (
          <div className="space-y-5">
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              <SummaryStatCard title="Verification" value={summary.verification.toUpperCase()} />
              <SummaryStatCard title="Active Internships" value={summary.activeInternships} />
              <SummaryStatCard title="Applicants" value={summary.applicants} />
              <SummaryStatCard title="Shortlisted" value={summary.shortlisted} />
              <SummaryStatCard title="Matched Candidates" value={summary.matched} />
            </section>
            <SectionPanel title="Latest Hiring Activity" subtitle="Recent applicant activity.">
              {apps.length === 0 ? <Empty text="No applicants yet." /> : (
                <div className="space-y-2">{apps.slice(0, 6).map((a) => <div key={a._id} className="surface-subtle px-4 py-3 text-sm text-slate-700 dark:text-slate-300">{a.intern?.fullName || "Candidate"} • {a.internship?.role || "Internship"} • {a.status} • {fmtDate(a.createdAt)}</div>)}</div>
              )}
            </SectionPanel>
            <SectionPanel title="Overview Notes" subtitle="Current account status.">
              <div className="space-y-2">
                {summary.activeInternships === 0 && <Empty text="No internships posted yet." />}
                {summary.applicants === 0 && <Empty text="No applicants yet." />}
                {summary.matched === 0 && <Empty text="No matched candidates available yet." />}
              </div>
            </SectionPanel>
          </div>
        );
      case "profile":
        return <SectionPanel title="Company Profile" subtitle="Live company profile data.">{!profile ? <Empty text="Company profile not available." /> : <div className="grid gap-3 sm:grid-cols-2"><div className="surface-subtle px-3 py-2.5"><p className="text-xs text-slate-500">Company</p><p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{profile.companyName || "-"}</p></div><div className="surface-subtle px-3 py-2.5"><p className="text-xs text-slate-500">Email</p><p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{profile.companyEmail || "-"}</p></div><div className="surface-subtle px-3 py-2.5"><p className="text-xs text-slate-500">GST</p><p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{profile.gst || "-"}</p></div><div className="surface-subtle px-3 py-2.5"><p className="text-xs text-slate-500">Contact</p><p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{profile.contactName || "-"}</p></div><div className="surface-subtle px-3 py-2.5"><p className="text-xs text-slate-500">Phone</p><p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{profile.phone || "-"}</p></div><div className="surface-subtle px-3 py-2.5"><p className="text-xs text-slate-500">Website</p><p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{profile.website || "-"}</p></div><div className="surface-subtle px-3 py-2.5 sm:col-span-2"><p className="text-xs text-slate-500">Address</p><p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{profile.address || "-"}</p></div><div className="surface-subtle px-3 py-2.5 sm:col-span-2"><p className="text-xs text-slate-500">Description</p><p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{profile.description || "-"}</p></div></div>}</SectionPanel>;
      case "profile-edit":
        return <SectionPanel title="Edit Company Profile" subtitle="Update profile information."><form className="space-y-4" onSubmit={saveProfile}><div className="grid gap-4 sm:grid-cols-2"><input className={field} placeholder="Company Name" value={profileForm.companyName} onChange={(e) => setProfileForm((p) => ({ ...p, companyName: e.target.value }))} /><input className={field} placeholder="Contact Name" value={profileForm.contactName} onChange={(e) => setProfileForm((p) => ({ ...p, contactName: e.target.value }))} /><input className={field} placeholder="Phone" value={profileForm.phone} onChange={(e) => setProfileForm((p) => ({ ...p, phone: e.target.value }))} /><input className={field} placeholder="Website" value={profileForm.website} onChange={(e) => setProfileForm((p) => ({ ...p, website: e.target.value }))} /><input className={`${field} sm:col-span-2`} placeholder="Address" value={profileForm.address} onChange={(e) => setProfileForm((p) => ({ ...p, address: e.target.value }))} /><textarea className={`${field} min-h-28 sm:col-span-2`} placeholder="Description" value={profileForm.description} onChange={(e) => setProfileForm((p) => ({ ...p, description: e.target.value }))} /></div><Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save Profile"}</Button></form></SectionPanel>;
      case "verification":
        return <SectionPanel title="Verification Status" subtitle="Current verification state."><div className="surface-subtle px-4 py-3 text-sm text-slate-700 dark:text-slate-300">Status: {summary.verification.toUpperCase()}</div></SectionPanel>;
      case "hiring-post":
        return (
          <SectionPanel title="Post Internship" subtitle="Create a formal internship posting with complete role details.">
            <form className="space-y-6" onSubmit={createInternship}>
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Basic Internship Information</p>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <input className={field} placeholder="Internship Title" value={postForm.role} onChange={(e) => setPostForm((p) => ({ ...p, role: e.target.value }))} />
                  <input className={field} placeholder="Department / Domain" value={postForm.department} onChange={(e) => setPostForm((p) => ({ ...p, department: e.target.value }))} />
                  <input className={field} placeholder="Internship Type" value={postForm.internshipType} onChange={(e) => setPostForm((p) => ({ ...p, internshipType: e.target.value }))} />
                  <input className={field} placeholder="Work Mode (remote/on-site/hybrid)" value={postForm.mode} onChange={(e) => setPostForm((p) => ({ ...p, mode: e.target.value }))} />
                  <input className={field} placeholder="Location" value={postForm.location} onChange={(e) => setPostForm((p) => ({ ...p, location: e.target.value }))} />
                  <input className={field} placeholder="Duration (e.g. 3 months)" value={postForm.duration} onChange={(e) => setPostForm((p) => ({ ...p, duration: e.target.value }))} />
                  <input type="date" className={field} value={postForm.startDate} onChange={(e) => setPostForm((p) => ({ ...p, startDate: e.target.value }))} />
                  <input type="date" className={field} value={postForm.applicationDeadline} onChange={(e) => setPostForm((p) => ({ ...p, applicationDeadline: e.target.value }))} />
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Compensation & Openings</p>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <input className={field} placeholder="Stipend" value={postForm.stipend} onChange={(e) => setPostForm((p) => ({ ...p, stipend: e.target.value }))} />
                  <input className={field} placeholder="Perks / Benefits" value={postForm.perks} onChange={(e) => setPostForm((p) => ({ ...p, perks: e.target.value }))} />
                  <input type="number" min={1} className={field} placeholder="Number of Openings" value={postForm.openings} onChange={(e) => setPostForm((p) => ({ ...p, openings: e.target.value }))} />
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Role Information</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <textarea className={`${field} min-h-24 sm:col-span-2`} placeholder="Job Description" value={postForm.description} onChange={(e) => setPostForm((p) => ({ ...p, description: e.target.value }))} />
                  <textarea className={`${field} min-h-24 sm:col-span-2`} placeholder="Roles & Responsibilities" value={postForm.responsibilities} onChange={(e) => setPostForm((p) => ({ ...p, responsibilities: e.target.value }))} />
                  <input className={field} placeholder="Required Skills (comma separated)" value={postForm.skillsRequired} onChange={(e) => setPostForm((p) => ({ ...p, skillsRequired: e.target.value }))} />
                  <input className={field} placeholder="Preferred Skills (comma separated)" value={postForm.prioritySkills} onChange={(e) => setPostForm((p) => ({ ...p, prioritySkills: e.target.value }))} />
                  <textarea className={`${field} min-h-20 sm:col-span-2`} placeholder="Eligibility Criteria" value={postForm.eligibilityCriteria} onChange={(e) => setPostForm((p) => ({ ...p, eligibilityCriteria: e.target.value }))} />
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Candidate Preferences & Process</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <input className={field} placeholder="Education Qualification" value={postForm.educationQualification} onChange={(e) => setPostForm((p) => ({ ...p, educationQualification: e.target.value }))} />
                  <input className={field} placeholder="Branch / Degree Preferences" value={postForm.degreePreferences} onChange={(e) => setPostForm((p) => ({ ...p, degreePreferences: e.target.value }))} />
                  <input className={field} placeholder="Minimum CGPA (if applicable)" value={postForm.minimumCgpa} onChange={(e) => setPostForm((p) => ({ ...p, minimumCgpa: e.target.value }))} />
                  <input className={field} placeholder="Experience Requirement" value={postForm.experienceRequirement} onChange={(e) => setPostForm((p) => ({ ...p, experienceRequirement: e.target.value }))} />
                  <textarea className={`${field} min-h-20 sm:col-span-2`} placeholder="Selection Process" value={postForm.selectionProcess} onChange={(e) => setPostForm((p) => ({ ...p, selectionProcess: e.target.value }))} />
                  <textarea className={`${field} min-h-20 sm:col-span-2`} placeholder="Interview Rounds" value={postForm.interviewRoundsInfo} onChange={(e) => setPostForm((p) => ({ ...p, interviewRoundsInfo: e.target.value }))} />
                  <textarea className={`${field} min-h-20 sm:col-span-2`} placeholder="Additional Instructions" value={postForm.additionalInstructions} onChange={(e) => setPostForm((p) => ({ ...p, additionalInstructions: e.target.value }))} />
                  <input className={`${field} sm:col-span-2`} placeholder="HR Contact Details" value={postForm.hrContact} onChange={(e) => setPostForm((p) => ({ ...p, hrContact: e.target.value }))} />
                </div>
              </div>

              <Button type="submit" disabled={saving}>{saving ? "Posting..." : "Publish Internship"}</Button>
            </form>
          </SectionPanel>
        );
      case "hiring-active":
        return (
          <SectionPanel title="Active Internships" subtitle="Live internships list.">
            {internships.filter((i) => i.isActive).length === 0 ? (
              <Empty text="No internships posted yet." />
            ) : (
              <div className="space-y-3">
                {internships.filter((i) => i.isActive).map((i) => (
                  <div key={i._id} className="surface-subtle flex flex-wrap items-start justify-between gap-3 px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{i.role}</p>
                      <p className="text-xs text-slate-600 dark:text-slate-300">{i.location || "Location not specified"} • {i.mode || "Mode not specified"}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Posted: {fmtDate(i.createdAt)}</p>
                    </div>
                    <Button type="button" size="sm" variant="secondary" onClick={() => removeInternship(i._id)} disabled={saving}>
                      Delete Internship
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </SectionPanel>
        );
      case "hiring-applicants":
        return applicantPanel(apps, "Applicants", "All applicants across internships.", "No applicants yet.");
      case "hiring-shortlisted":
        return applicantPanel(shortlisted, "Shortlisted", "Candidates in shortlisted stage.", "No shortlisted candidates yet.");
      case "hiring-pipeline":
        return <SectionPanel title="Hiring Pipeline" subtitle="Real status breakdown.">{apps.length === 0 ? <Empty text="No applicants yet." /> : <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{Object.entries(statusCounts).map(([stage, count]) => <div key={stage} className="surface-subtle px-3 py-2.5"><p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">{stage}</p><p className="text-xl font-bold text-slate-900 dark:text-slate-100">{count}</p></div>)}</div>}</SectionPanel>;
      case "matching-ai":
        return <SectionPanel title="AI Matched Candidates" subtitle="Backend-ranked matched candidates.">{matches.length === 0 ? <Empty text="No matched candidates available yet." /> : <div className="space-y-2">{matches.map((m, idx) => <div key={`${m.internshipId}-${m.internProfile?._id || idx}`} className="surface-subtle flex flex-wrap items-center justify-between gap-2 px-4 py-3"><div><p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{m.internProfile?.fullName || "Candidate"}</p><p className="text-xs text-slate-600 dark:text-slate-300">{m.internshipRole}</p></div><p className="text-sm font-semibold text-primary-700 dark:text-primary-300">{m.score}%</p></div>)}</div>}</SectionPanel>;
      case "matching-search":
        return (
          <SectionPanel title="Candidate Search" subtitle="Search candidates by name or email.">
            <div className="space-y-3">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name or email"
                className={`${field} w-full`}
              />

              {searchLoading && <Empty text="Searching candidates..." />}

              {!searchLoading && searchError && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">
                  {searchError}
                </div>
              )}

              {!searchLoading && !searchError && !debouncedQuery && (
                <Empty text="Type a candidate name or email to search." />
              )}

              {!searchLoading && !searchError && debouncedQuery && searchResults.length === 0 && (
                <Empty text="No candidates found for this search." />
              )}

              {!searchLoading && !searchError && searchResults.length > 0 && (
                <div className="space-y-2">
                  {searchResults.map((candidate) => (
                    <div key={candidate._id} className="surface-subtle flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{candidate.fullName || "Candidate"}</p>
                        <p className="text-xs text-slate-600 dark:text-slate-300">{candidate.email || "No email"}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{candidate.mobile || "No mobile"}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs uppercase tracking-wide text-slate-500">Resume Score</p>
                        <p className="text-sm font-semibold text-primary-700 dark:text-primary-300">{candidate.resumeScore || 0}/100</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </SectionPanel>
        );
      case "matching-saved":
        return <SectionPanel title="Saved Candidates" subtitle="Saved shortlist bookmarks."><Empty text="No saved candidates yet." /></SectionPanel>;
      case "reports-feedback":
        return <SectionPanel title="Feedback" subtitle="Collected HR feedback on applications.">{apps.flatMap((a) => a.hrFeedback || []).length === 0 ? <Empty text="No feedback added yet." /> : <div className="space-y-2">{apps.flatMap((a) => (a.hrFeedback || []).map((f, idx) => ({ id: `${a._id}-${idx}`, name: a.intern?.fullName || "Candidate", role: a.internship?.role || "Internship", text: f.feedback, createdAt: f.createdAt }))).sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()).map((f) => <div key={f.id} className="surface-subtle px-4 py-3"><p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{f.name}</p><p className="text-xs text-slate-500 dark:text-slate-400">{f.role} • {fmtDate(f.createdAt)}</p><p className="mt-1 text-sm text-slate-700 dark:text-slate-300">{f.text}</p></div>)}</div>}</SectionPanel>;
      case "reports-notes":
        return <SectionPanel title="Hiring Notes" subtitle="Stage notes captured in pipeline updates.">{apps.flatMap((a) => a.stageHistory || []).filter((h) => h.note?.trim()).length === 0 ? <Empty text="No hiring notes available yet." /> : <div className="space-y-2">{apps.flatMap((a) => (a.stageHistory || []).filter((h) => h.note?.trim()).map((h, idx) => ({ id: `${a._id}-${idx}`, name: a.intern?.fullName || "Candidate", role: a.internship?.role || "Internship", stage: h.stage, note: h.note, changedAt: h.changedAt }))).sort((a, b) => new Date(b.changedAt || 0).getTime() - new Date(a.changedAt || 0).getTime()).map((n) => <div key={n.id} className="surface-subtle px-4 py-3"><p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{n.name}</p><p className="text-xs text-slate-500 dark:text-slate-400">{n.role} • {n.stage} • {fmtDate(n.changedAt)}</p><p className="mt-1 text-sm text-slate-700 dark:text-slate-300">{n.note}</p></div>)}</div>}</SectionPanel>;
      case "reports-export":
        return <SectionPanel title="Reports / Export" subtitle="Export live hiring data."><div className="space-y-3"><div className="grid gap-3 sm:grid-cols-3"><div className="surface-subtle px-3 py-2.5"><p className="text-xs text-slate-500">Internships</p><p className="text-lg font-semibold text-slate-900 dark:text-slate-100">{internships.length}</p></div><div className="surface-subtle px-3 py-2.5"><p className="text-xs text-slate-500">Applicants</p><p className="text-lg font-semibold text-slate-900 dark:text-slate-100">{apps.length}</p></div><div className="surface-subtle px-3 py-2.5"><p className="text-xs text-slate-500">Shortlisted</p><p className="text-lg font-semibold text-slate-900 dark:text-slate-100">{shortlisted.length}</p></div></div><Button type="button" onClick={exportCsv} disabled={apps.length === 0}>Export Applicants CSV</Button>{apps.length === 0 && <Empty text="No applicant data available for export." />}</div></SectionPanel>;
      default:
        return null;
    }
  })();

  return (
    <RoleDashboardGuard expectedRole="company">
      <CompanyShell welcomeName={profile?.companyName} onLogout={logout}>
        {loading ? (
          <div className="surface-muted px-4 py-3 text-sm text-slate-700 dark:text-slate-300">Loading company dashboard...</div>
        ) : (
          <div className="space-y-5">
            {error && <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">{error}</div>}
            {success && <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300">{success}</div>}
            {viewNode}
            {detailApp && (
              <ApplicantDetailsModal
                application={detailApp}
                onClose={() => {
                  setApplicantDetailId(null);
                  setDetailResumeError(null);
                }}
                saving={saving}
                inputClassName={field}
                statusDraft={statusDrafts[detailApp._id] ?? normalizeApplicantStage(detailApp.status)}
                onStatusDraftChange={(value) => setStatusDrafts((prev) => ({ ...prev, [detailApp._id]: value }))}
                onSaveStatus={() =>
                  applyStage(detailApp._id, statusDrafts[detailApp._id] ?? normalizeApplicantStage(detailApp.status), "Status updated from hiring dashboard")
                }
                onApplyStage={(status, note) => applyStage(detailApp._id, status, note ?? "")}
                interviewForm={interviewForms[detailApp._id] ?? DEFAULT_INTERVIEW_FORM}
                onInterviewFormChange={(patch) =>
                  setInterviewForms((prev) => ({
                    ...prev,
                    [detailApp._id]: { ...(prev[detailApp._id] ?? DEFAULT_INTERVIEW_FORM), ...patch }
                  }))
                }
                onCreateInterview={() => createInterviewRound(detailApp._id)}
                onUpdateRound={(roundId, status) => updateRoundStatus(detailApp._id, roundId, status)}
                onViewResume={async () => {
                  try {
                    setDetailResumeError(null);
                    await openCompanyApplicationResume(detailApp._id);
                  } catch (e) {
                    setDetailResumeError((e as Error).message || "Resume not available");
                  }
                }}
                resumeError={detailResumeError}
              />
            )}
          </div>
        )}
      </CompanyShell>
    </RoleDashboardGuard>
  );
}
