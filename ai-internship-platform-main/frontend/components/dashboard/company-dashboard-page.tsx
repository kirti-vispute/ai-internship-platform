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
  fetchCompanyRecruiters,
  fetchCompanyHrInsights,
  createCompanyHrUser,
  deleteCompanyHrUser,
  updateCompanyHrPermissions,
  HR_ASSIGNABLE_PERMISSIONS,
  type CompanyHrInsights,
  type CompanyHrUser,
  fetchCompanyAnalytics,
  assignRecruiterToInternship,
  assignRecruiterToApplication,
  deleteCompanyInternship,
  postCompanyInternship,
  scheduleInterviewRound,
  updateCompanyApplicationStage,
  updateInterviewRound,
  updateCompanyProfile,
  searchCandidates,
  CandidateSearchResult,
  addApplicationFeedback,
  CompanyCurrentUser
} from "@/lib/company-portal";
import { ApplicantDetailsModal, type InterviewFormState } from "@/components/dashboard/applicant-details-modal";
import { PIPELINE_STAGES } from "@/constants/pipelineStages";

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
  | "reports-export"
  | "team-recruiters"
  | "analytics-company"
  | "analytics-salary";

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

function normalizePipelineStatus(status: string) {
  const value = String(status || "").toLowerCase();
  if (value === "screening") return "reviewed";
  if (value === "offered") return "selected";
  if (value === "technical_round") return "technical_round";
  if (value === "hr_round") return "hr_round";
  if (value === "under_review") return "under_review";
  if (value === "on_hold") return "on_hold";
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
  const [currentUser, setCurrentUser] = useState<CompanyCurrentUser | null>(null);
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
  const [recruiters, setRecruiters] = useState<Array<{ _id: string; email: string; displayName?: string; companyAccountType: "hr" | "ceo"; isActive: boolean }>>([]);
  const [hrInsights, setHrInsights] = useState<CompanyHrInsights | null>(null);
  const [hrForm, setHrForm] = useState({ name: "", email: "", password: "" });
  const [hrFormPermissions, setHrFormPermissions] = useState<string[]>([...HR_ASSIGNABLE_PERMISSIONS]);
  const [selectedHrId, setSelectedHrId] = useState<string | null>(null);
  const [permissionDraft, setPermissionDraft] = useState<string[]>([]);
  const [hrActionLoading, setHrActionLoading] = useState(false);
  const [selectedRecruiterByInternship, setSelectedRecruiterByInternship] = useState<Record<string, string>>({});
  const [selectedRecruiterByApplication, setSelectedRecruiterByApplication] = useState<Record<string, string>>({});
  const [analytics, setAnalytics] = useState<{
    recruiterPerformance: Array<{
      recruiterId: string;
      candidatesHandled: number;
      shortlistedCandidates: number;
      hiredCandidates: number;
      conversionRate: number;
      interviewSuccessRate: number;
      recruiterResponseTimeHours: number;
    }>;
    hiringAnalytics: {
      totalHires: number;
      totalApplications: number;
      departmentWiseHiring: Record<string, number>;
      internshipPerformance: number;
    };
    salaryAnalytics: {
      offeredSalaryPerCandidate: number[];
      stipendAnalytics: number[];
      averagePackage: number;
      totalSalaryExpenditure: number;
    };
  } | null>(null);
  const [detailResumeError, setDetailResumeError] = useState<string | null>(null);
  const [applicantDetailId, setApplicantDetailId] = useState<string | null>(null);
  const [interviewForms, setInterviewForms] = useState<Record<string, InterviewFormState>>({});
  const [statusDrafts, setStatusDrafts] = useState<Record<string, string>>({});
  const [feedbackDrafts, setFeedbackDrafts] = useState<Record<string, { feedback: string; rating: number; visibility: "internal" | "candidate" }>>({});

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
        const companyContext = await fetchCompanyProfile();
        setProfile(companyContext.profile);
        setCurrentUser(companyContext.currentUser);
        if (WITH_INTERNSHIPS.has(view)) setInternships(await fetchCompanyInternships());
        else setInternships([]);
        if (WITH_APPS.has(view)) setApps(await fetchCompanyApplications());
        else setApps([]);
        if (WITH_MATCHES.has(view)) setMatches(await fetchCompanyMatchedCandidates());
        else setMatches([]);
        if (["team-recruiters", "analytics-company", "analytics-salary"].includes(view)) {
          const insights =
            view === "team-recruiters" || view === "analytics-company"
              ? await fetchCompanyHrInsights(true)
              : null;
          setHrInsights(insights);
          if (insights && view === "team-recruiters") {
            setRecruiters(
              insights.hrUsers.map((hr) => ({
                _id: hr.id,
                email: hr.email,
                displayName: hr.name,
                companyAccountType: "hr" as const,
                isActive: hr.isActive
              }))
            );
          }
          setAnalytics(await fetchCompanyAnalytics());
        } else {
          setRecruiters([]);
          setHrInsights(null);
          setAnalytics(null);
        }
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
  const isHrScoped = useMemo(() => currentUser?.companyAccountType === "hr", [currentUser?.companyAccountType]);
  const canManageRecruiters = useMemo(
    () => (currentUser?.permissions || []).includes("company:hr:manage") || ["owner", "ceo"].includes(currentUser?.companyAccountType || ""),
    [currentUser]
  );
  const isCeoOrOwner = useMemo(
    () => ["owner", "ceo"].includes(currentUser?.companyAccountType || ""),
    [currentUser?.companyAccountType]
  );

  async function reloadHrManagement() {
    const insights = await fetchCompanyHrInsights(true);
    setHrInsights(insights);
    setRecruiters(
      insights.hrUsers.map((hr) => ({
        _id: hr.id,
        email: hr.email,
        displayName: hr.name,
        companyAccountType: "hr" as const,
        isActive: hr.isActive
      }))
    );
  }

  async function handleCreateHr() {
    if (!hrForm.name.trim() || !hrForm.email.trim() || !hrForm.password.trim()) {
      setError("Name, email, and password are required to add HR.");
      return;
    }
    try {
      setHrActionLoading(true);
      setError(null);
      await createCompanyHrUser({
        name: hrForm.name.trim(),
        email: hrForm.email.trim(),
        password: hrForm.password,
        permissions: hrFormPermissions
      });
      setHrForm({ name: "", email: "", password: "" });
      setHrFormPermissions([...HR_ASSIGNABLE_PERMISSIONS]);
      setSuccess("HR account created successfully.");
      await reloadHrManagement();
    } catch (e) {
      setError((e as Error).message || "Failed to create HR account.");
    } finally {
      setHrActionLoading(false);
    }
  }

  async function handleDeleteHr(hrId: string, email: string) {
    if (!window.confirm(`Delete HR account ${email}? This cannot be undone.`)) return;
    try {
      setHrActionLoading(true);
      setError(null);
      await deleteCompanyHrUser(hrId);
      if (selectedHrId === hrId) setSelectedHrId(null);
      setSuccess("HR account deleted.");
      await reloadHrManagement();
    } catch (e) {
      setError((e as Error).message || "Failed to delete HR account.");
    } finally {
      setHrActionLoading(false);
    }
  }

  function openHrInsights(hr: CompanyHrUser) {
    setSelectedHrId(hr.id);
    setPermissionDraft([...hr.permissions.filter((p) => HR_ASSIGNABLE_PERMISSIONS.includes(p as (typeof HR_ASSIGNABLE_PERMISSIONS)[number]))]);
  }

  async function handleSaveHrPermissions(hrId: string) {
    try {
      setHrActionLoading(true);
      setError(null);
      await updateCompanyHrPermissions(hrId, permissionDraft);
      setSuccess("HR permissions updated.");
      await reloadHrManagement();
    } catch (e) {
      setError((e as Error).message || "Failed to update HR permissions.");
    } finally {
      setHrActionLoading(false);
    }
  }
  const canAssign = useMemo(
    () => (currentUser?.permissions || []).includes("company:internship:assign") || ["owner", "ceo"].includes(currentUser?.companyAccountType || ""),
    [currentUser]
  );
  const canViewSalary = useMemo(
    () => (currentUser?.permissions || []).includes("company:analytics:salary") || ["owner", "ceo"].includes(currentUser?.companyAccountType || ""),
    [currentUser]
  );
  const detailApp = useMemo(
    () => (applicantDetailId ? apps.find((application) => application._id === applicantDetailId) ?? null : null),
    [apps, applicantDetailId]
  );

  useEffect(() => {
    if (view !== "hiring-applicants" && view !== "hiring-shortlisted") {
      setApplicantDetailId(null);
    }
  }, [view]);

  useEffect(() => {
    if (applicantDetailId && !detailApp) setApplicantDetailId(null);
  }, [applicantDetailId, detailApp]);

  const statusCounts = useMemo(() => {
    const base: Record<string, number> = {
      applied: 0,
      shortlisted: 0,
      under_review: 0,
      interview_scheduled: 0,
      technical_round: 0,
      hr_round: 0,
      selected: 0,
      rejected: 0,
      on_hold: 0
    };
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
      matched: matches.length,
      roleLabel: currentUser?.companyAccountType?.toUpperCase() || "OWNER"
    }),
    [profile?.verificationStatus, internships, apps.length, shortlisted.length, matches.length, currentUser?.companyAccountType]
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

  async function assignInternship(internshipId: string) {
    const recruiterId = selectedRecruiterByInternship[internshipId];
    if (!recruiterId) return;
    try {
      setSaving(true);
      await assignRecruiterToInternship(internshipId, recruiterId);
      setInternships(await fetchCompanyInternships(true));
      setApps(await fetchCompanyApplications(true));
      setSuccess("Internship assigned to recruiter.");
    } catch (e) {
      setError((e as Error).message || "Failed to assign internship.");
    } finally {
      setSaving(false);
    }
  }

  async function assignApplication(applicationId: string) {
    const recruiterId = selectedRecruiterByApplication[applicationId];
    if (!recruiterId) return;
    try {
      setSaving(true);
      await assignRecruiterToApplication(applicationId, recruiterId);
      setApps(await fetchCompanyApplications(true));
      setSuccess("Candidate assigned to recruiter.");
    } catch (e) {
      setError((e as Error).message || "Failed to assign candidate.");
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

  async function submitFeedback(applicationId: string) {
    const draft = feedbackDrafts[applicationId];
    if (!draft?.feedback?.trim()) {
      setError("Feedback text is required.");
      return;
    }
    try {
      setSaving(true);
      setError(null);
      await addApplicationFeedback(applicationId, draft);
      setApps(await fetchCompanyApplications(true));
      setSuccess("Feedback saved.");
      setFeedbackDrafts((prev) => ({ ...prev, [applicationId]: { feedback: "", rating: 3, visibility: "candidate" } }));
    } catch (e) {
      setError((e as Error).message || "Failed to add feedback.");
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
                  <div className="flex w-full min-w-0 flex-col items-stretch gap-3 sm:w-auto sm:max-w-[min(100%,24rem)] sm:items-end">
                    <p className="text-left text-xs text-slate-500 dark:text-slate-400 sm:text-right">
                      Applied: <span className="font-medium text-slate-700 dark:text-slate-200">{fmtAppliedDateTime(a.createdAt)}</span>
                    </p>
                    <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
                      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                        <span className="inline-flex min-h-9 min-w-[7.25rem] shrink-0 items-center justify-center whitespace-nowrap rounded-full border border-primary-400 bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm dark:border-primary-500 dark:bg-primary-500 dark:text-white">
                          Match {matchPct}%
                        </span>
                        <span className="inline-flex min-h-9 min-w-[7.25rem] shrink-0 items-center justify-center whitespace-nowrap rounded-full border border-slate-300 bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-900 shadow-sm dark:border-slate-500 dark:bg-slate-800 dark:text-slate-50">
                          Resume {resumeScore}
                        </span>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        className="w-full shrink-0 border-slate-300 bg-white hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:hover:bg-slate-800 sm:w-auto"
                        onClick={() => {
                          setApplicantDetailId(a._id);
                          setStatusDrafts((prev) => ({ ...prev, [a._id]: normalizeApplicantStage(a.status) }));
                        }}
                      >
                        View Details
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
              <SummaryStatCard title="Workspace" value={summary.roleLabel} />
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
        if (isHrScoped) {
          return (
            <SectionPanel title="Post Internship" subtitle="HR workspace can manage assigned internships only.">
              <Empty text="Internship creation is restricted to CEO/Company Admin." />
            </SectionPanel>
          );
        }
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
                    <div className="flex flex-wrap items-center gap-2">
                      {canAssign && recruiters.length > 0 && (
                        <>
                          <select
                            className="surface-subtle rounded-lg border border-slate-300 px-2 py-1.5 text-xs dark:border-slate-600"
                            value={selectedRecruiterByInternship[i._id] || ""}
                            onChange={(event) =>
                              setSelectedRecruiterByInternship((prev) => ({ ...prev, [i._id]: event.target.value }))
                            }
                          >
                            <option value="">Assign recruiter</option>
                            {recruiters.map((recruiter) => (
                              <option key={recruiter._id} value={recruiter._id}>
                                {recruiter.email} ({recruiter.companyAccountType})
                              </option>
                            ))}
                          </select>
                          <Button type="button" size="sm" variant="secondary" disabled={saving || !selectedRecruiterByInternship[i._id]} onClick={() => assignInternship(i._id)}>
                            Assign
                          </Button>
                        </>
                      )}
                      <Button type="button" size="sm" variant="secondary" onClick={() => removeInternship(i._id)} disabled={saving || isHrScoped}>
                      Delete Internship
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionPanel>
        );
      case "hiring-applicants":
        return (
          <SectionPanel title="Applicants" subtitle={isHrScoped ? "Assigned candidates in your recruiter workspace." : "All applicants across internships."}>
            {apps.length === 0 ? (
              <Empty text="No applicants yet." />
            ) : (
              <div className="space-y-3">
                {apps.map((a) => (
                  <div key={a._id} className="surface-subtle flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{a.intern?.fullName || "Candidate"}</p>
                      <p className="text-xs text-slate-600 dark:text-slate-300">{a.internship?.role || "Internship"} • {a.status}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {canAssign && recruiters.length > 0 && (
                        <>
                          <select
                            className="surface-subtle rounded-lg border border-slate-300 px-2 py-1.5 text-xs dark:border-slate-600"
                            value={selectedRecruiterByApplication[a._id] || ""}
                            onChange={(event) =>
                              setSelectedRecruiterByApplication((prev) => ({ ...prev, [a._id]: event.target.value }))
                            }
                          >
                            <option value="">Assign recruiter</option>
                            {recruiters.map((recruiter) => (
                              <option key={recruiter._id} value={recruiter._id}>
                                {recruiter.email} ({recruiter.companyAccountType})
                              </option>
                            ))}
                          </select>
                          <Button type="button" size="sm" variant="secondary" disabled={!selectedRecruiterByApplication[a._id] || saving} onClick={() => assignApplication(a._id)}>
                            Assign
                          </Button>
                        </>
                      )}
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        className="w-full shrink-0 border-slate-300 bg-white hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:hover:bg-slate-800 sm:w-auto"
                        onClick={() => {
                          setApplicantDetailId(a._id);
                          setStatusDrafts((prev) => ({ ...prev, [a._id]: normalizeApplicantStage(a.status) }));
                        }}
                      >
                        View Details
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionPanel>
        );
      case "hiring-shortlisted":
        return applicantPanel(shortlisted, "Shortlisted", "Candidates in shortlisted stage.", "No shortlisted candidates yet.");
      case "hiring-pipeline":
        return (
          <SectionPanel title="Hiring Pipeline" subtitle="Real status breakdown.">
            {apps.length === 0 ? (
              <Empty text="No applicants yet." />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {PIPELINE_STAGES.map((stage) => (
                  <div key={stage} className="surface-subtle px-3 py-2.5">
                    <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">{stage.replace(/_/g, " ")}</p>
                    <p className="text-xl font-bold text-slate-900 dark:text-slate-100">{statusCounts[stage] || 0}</p>
                  </div>
                ))}
              </div>
            )}
          </SectionPanel>
        );
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
        return <SectionPanel title="Reports / Export" subtitle={isHrScoped ? "Export your assigned hiring records." : "Export company hiring reports."}><div className="space-y-3"><div className="grid gap-3 sm:grid-cols-3"><div className="surface-subtle px-3 py-2.5"><p className="text-xs text-slate-500">Internships</p><p className="text-lg font-semibold text-slate-900 dark:text-slate-100">{internships.length}</p></div><div className="surface-subtle px-3 py-2.5"><p className="text-xs text-slate-500">Applicants</p><p className="text-lg font-semibold text-slate-900 dark:text-slate-100">{apps.length}</p></div><div className="surface-subtle px-3 py-2.5"><p className="text-xs text-slate-500">Shortlisted</p><p className="text-lg font-semibold text-slate-900 dark:text-slate-100">{shortlisted.length}</p></div></div><Button type="button" onClick={exportCsv} disabled={apps.length === 0}>Export Applicants CSV</Button>{apps.length === 0 && <Empty text="No applicant data available for export." />}</div></SectionPanel>;
      case "team-recruiters":
        return (
          <SectionPanel title="HR Management" subtitle="CEO controls: create HR accounts, permissions, performance insights, and removal.">
            {!canManageRecruiters || !isCeoOrOwner ? (
              <Empty text="HR management is restricted to CEO / Company Admin." />
            ) : (
              <div className="space-y-5">
                {hrInsights && (
                  <div className="grid gap-3 sm:grid-cols-4">
                    <div className="surface-subtle px-3 py-2.5"><p className="text-xs text-slate-500">HR Users</p><p className="text-lg font-semibold">{hrInsights.summary.totalHrUsers}</p></div>
                    <div className="surface-subtle px-3 py-2.5"><p className="text-xs text-slate-500">Assigned Candidates</p><p className="text-lg font-semibold">{hrInsights.summary.totalAssignedCandidates}</p></div>
                    <div className="surface-subtle px-3 py-2.5"><p className="text-xs text-slate-500">Total Hires</p><p className="text-lg font-semibold">{hrInsights.summary.totalHires}</p></div>
                    <div className="surface-subtle px-3 py-2.5"><p className="text-xs text-slate-500">Avg Conversion</p><p className="text-lg font-semibold">{hrInsights.summary.averageConversionRate}%</p></div>
                  </div>
                )}

                <div className="surface-subtle space-y-3 p-4">
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Add HR User</p>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <input className={field} placeholder="Full name" value={hrForm.name} onChange={(e) => setHrForm((p) => ({ ...p, name: e.target.value }))} />
                    <input className={field} placeholder="Email" type="email" value={hrForm.email} onChange={(e) => setHrForm((p) => ({ ...p, email: e.target.value }))} />
                    <input className={field} placeholder="Password (min 8 chars)" type="password" value={hrForm.password} onChange={(e) => setHrForm((p) => ({ ...p, password: e.target.value }))} />
                  </div>
                  <div className="flex flex-wrap gap-3 text-xs text-slate-600 dark:text-slate-300">
                    {HR_ASSIGNABLE_PERMISSIONS.map((perm) => (
                      <label key={perm} className="inline-flex items-center gap-1.5">
                        <input
                          type="checkbox"
                          checked={hrFormPermissions.includes(perm)}
                          onChange={(e) =>
                            setHrFormPermissions((prev) =>
                              e.target.checked ? [...new Set([...prev, perm])] : prev.filter((p) => p !== perm)
                            )
                          }
                        />
                        {perm}
                      </label>
                    ))}
                  </div>
                  <Button type="button" onClick={handleCreateHr} disabled={hrActionLoading}>
                    {hrActionLoading ? "Saving..." : "Add HR"}
                  </Button>
                </div>

                {!hrInsights || hrInsights.hrUsers.length === 0 ? (
                  <Empty text="No HR accounts yet. Create one above." />
                ) : (
                  <div className="space-y-3">
                    {hrInsights.hrUsers.map((hr) => (
                      <div key={hr.id} className="surface-subtle space-y-3 px-4 py-3">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{hr.name}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{hr.email} • {hr.isActive ? "Active" : "Inactive"}</p>
                            <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                              {hr.assignedInternships} internships • {hr.assignedCandidates} candidates • {hr.performanceMetrics.hiredCandidates} hires • {hr.performanceMetrics.conversionRate}% conversion
                            </p>
                            <p className="text-xs text-slate-500">{hr.performanceMetrics.activitySummary}</p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Button type="button" variant="secondary" onClick={() => openHrInsights(hr)} disabled={hrActionLoading}>
                              View Insights
                            </Button>
                            <Button type="button" variant="secondary" onClick={() => handleDeleteHr(hr.id, hr.email)} disabled={hrActionLoading}>
                              Delete HR
                            </Button>
                          </div>
                        </div>

                        {selectedHrId === hr.id && (
                          <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Performance</p>
                            <div className="mt-2 grid gap-2 sm:grid-cols-3 text-sm">
                              <p>Handled: {hr.performanceMetrics.candidatesHandled}</p>
                              <p>Shortlisted: {hr.performanceMetrics.shortlistedCandidates}</p>
                              <p>Interviews success: {hr.performanceMetrics.interviewSuccessRate}%</p>
                            </div>
                            <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Permissions</p>
                            <div className="mt-2 flex flex-wrap gap-3 text-xs">
                              {HR_ASSIGNABLE_PERMISSIONS.map((perm) => (
                                <label key={`${hr.id}-${perm}`} className="inline-flex items-center gap-1.5">
                                  <input
                                    type="checkbox"
                                    checked={permissionDraft.includes(perm)}
                                    onChange={(e) =>
                                      setPermissionDraft((prev) =>
                                        e.target.checked ? [...new Set([...prev, perm])] : prev.filter((p) => p !== perm)
                                      )
                                    }
                                  />
                                  {perm}
                                </label>
                              ))}
                            </div>
                            <div className="mt-3">
                              <Button type="button" onClick={() => handleSaveHrPermissions(hr.id)} disabled={hrActionLoading}>
                                Save Permissions
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </SectionPanel>
        );
      case "analytics-company":
        return (
          <SectionPanel title="Company Analytics" subtitle="Recruiter performance and hiring analytics.">
            {!analytics ? (
              <Empty text="Analytics not available." />
            ) : (
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="surface-subtle px-3 py-2.5"><p className="text-xs text-slate-500">Total Hires</p><p className="text-lg font-semibold">{analytics.hiringAnalytics.totalHires}</p></div>
                  <div className="surface-subtle px-3 py-2.5"><p className="text-xs text-slate-500">Total Applications</p><p className="text-lg font-semibold">{analytics.hiringAnalytics.totalApplications}</p></div>
                  <div className="surface-subtle px-3 py-2.5"><p className="text-xs text-slate-500">Internship Performance</p><p className="text-lg font-semibold">{analytics.hiringAnalytics.internshipPerformance}</p></div>
                </div>
                <div className="space-y-2">
                  {analytics.recruiterPerformance.map((item) => {
                    const hrMatch = hrInsights?.hrUsers.find((hr) => hr.id === item.recruiterId);
                    const label = hrMatch ? `${hrMatch.name} (${hrMatch.email})` : `Recruiter ${item.recruiterId}`;
                    return (
                      <div key={item.recruiterId} className="surface-subtle px-4 py-3 text-sm">
                        {label} • Handled {item.candidatesHandled} • Hired {item.hiredCandidates} • Conversion {item.conversionRate}%
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </SectionPanel>
        );
      case "analytics-salary":
        return (
          <SectionPanel title="Salary Insights" subtitle="Company stipend and salary analytics.">
            {!canViewSalary ? (
              <Empty text="Salary insights are restricted to CEO / Company Admin." />
            ) : !analytics ? (
              <Empty text="Salary analytics not available." />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="surface-subtle px-3 py-2.5"><p className="text-xs text-slate-500">Average Package</p><p className="text-lg font-semibold">{analytics.salaryAnalytics.averagePackage}</p></div>
                <div className="surface-subtle px-3 py-2.5"><p className="text-xs text-slate-500">Total Salary Expenditure</p><p className="text-lg font-semibold">{analytics.salaryAnalytics.totalSalaryExpenditure}</p></div>
              </div>
            )}
          </SectionPanel>
        );
      default:
        return null;
    }
  })();

  return (
    <RoleDashboardGuard expectedRole="company">
      <CompanyShell
        welcomeName={profile?.companyName}
        companyAccountType={currentUser?.companyAccountType}
        permissions={currentUser?.permissions || []}
        onLogout={logout}
      >
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
                onClose={() => setApplicantDetailId(null)}
                saving={saving}
                inputClassName={field}
                statusDraft={statusDrafts[detailApp._id] ?? normalizeApplicantStage(detailApp.status)}
                onStatusDraftChange={(value) => setStatusDrafts((prev) => ({ ...prev, [detailApp._id]: value }))}
                onSaveStatus={() =>
                  applyStage(detailApp._id, statusDrafts[detailApp._id] ?? normalizeApplicantStage(detailApp.status), "Status updated from hiring dashboard")
                }
                interviewForm={interviewForms[detailApp._id] ?? DEFAULT_INTERVIEW_FORM}
                onInterviewFormChange={(patch) =>
                  setInterviewForms((prev) => ({
                    ...prev,
                    [detailApp._id]: { ...(prev[detailApp._id] ?? DEFAULT_INTERVIEW_FORM), ...patch }
                  }))
                }
                onCreateInterview={() => createInterviewRound(detailApp._id)}
                onUpdateRound={(roundId, status) => updateRoundStatus(detailApp._id, roundId, status)}
                feedbackDraft={feedbackDrafts[detailApp._id] || { feedback: "", rating: 3, visibility: "candidate" }}
                onFeedbackDraftChange={(patch) =>
                  setFeedbackDrafts((prev) => ({
                    ...prev,
                    [detailApp._id]: { ...(prev[detailApp._id] || { feedback: "", rating: 3, visibility: "candidate" }), ...patch }
                  }))
                }
                onSubmitFeedback={() => submitFeedback(detailApp._id)}
              />
            )}
          </div>
        )}
      </CompanyShell>
    </RoleDashboardGuard>
  );
}
