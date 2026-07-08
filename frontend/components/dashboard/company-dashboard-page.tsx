"use client";

import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { SectionPanel } from "@/components/dashboard/section-panel";
import { Button } from "@/components/ui/button";
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
  fetchCompanyHiringScoringTemplates,
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
  CompanyCurrentUser,
  openCompanyApplicationResume,
  peekCompanyApplications,
  peekCompanyInternships,
  peekCompanyProfile,
  prefetchCompanyDashboardData
} from "@/lib/company-portal";
import { ApplicantDetailsModal, type InterviewFormState } from "@/components/dashboard/applicant-details-modal";
import { HiringSection, type HiringSectionFocus } from "@/components/dashboard/hiring";
import { CompanyDashboardHub, MatchedCandidatesView } from "@/components/dashboard/company";
import { CompanyDashboardPageIntro, companyDashboardStyles } from "@/components/dashboard/company/company-dashboard-layout";
import { hiringAIEngine, type InterviewScheduleSlot } from "@/lib/ai-hiring";
import { extractScheduledInterviews, findOverlappingInterviews, type ScheduledInterviewRecord } from "@/lib/interview-workflow";
import { useToast } from "@/components/ui/toast";
import { ReportDownloadButton } from "@/components/reports/report-download-button";

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
  "hiring-active",
  "hiring-applicants",
  "hiring-shortlisted",
  "hiring-pipeline",
  "matching-ai",
  "reports-feedback",
  "reports-notes",
  "reports-export"
]);

const HIRING_HUB_VIEWS = new Set<CompanyDashboardView>([
  "hiring-active",
  "hiring-applicants",
  "hiring-shortlisted",
  "hiring-pipeline"
]);

const HIRING_FOCUS_BY_VIEW: Partial<Record<CompanyDashboardView, HiringSectionFocus>> = {
  "hiring-active": "jobs",
  "hiring-applicants": "applications",
  "hiring-shortlisted": "shortlist",
  "hiring-pipeline": "pipeline"
};
const WITH_MATCHES = new Set<CompanyDashboardView>(["overview", "matching-ai"]);

const PROFILE_MODAL_VIEWS = new Set<CompanyDashboardView>([
  "overview",
  "matching-ai",
  "hiring-active",
  "hiring-applicants",
  "hiring-shortlisted",
  "hiring-pipeline"
]);

const field =
  "surface-subtle px-3 py-2 text-sm transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-primary-500/60 focus:border-primary-400 disabled:opacity-50 disabled:cursor-not-allowed";

function Empty({ text }: { text: string }) {
  return <div className="surface-subtle px-4 py-3 text-sm text-slate-600 dark:text-slate-300">{text}</div>;
}

function fmtDate(value?: string) {
  if (!value) return "-";
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return "-";
  return dt.toLocaleDateString("en-IN");
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
  const { pushToast } = useToast();
  const [profile, setProfile] = useState<CompanyProfile | null>(() => peekCompanyProfile()?.profile ?? null);
  const [currentUser, setCurrentUser] = useState<CompanyCurrentUser | null>(
    () => peekCompanyProfile()?.currentUser ?? null
  );
  const [internships, setInternships] = useState<CompanyInternship[]>(() => peekCompanyInternships() ?? []);
  const [apps, setApps] = useState<CompanyApplication[]>(() => peekCompanyApplications() ?? []);
  const [matches, setMatches] = useState<CompanyMatchedCandidate[]>([]);
  const [loading, setLoading] = useState(() => !peekCompanyProfile());
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

  useLayoutEffect(() => {
    const cachedProfile = peekCompanyProfile();
    if (cachedProfile) {
      setProfile(cachedProfile.profile);
      setCurrentUser(cachedProfile.currentUser);
      setLoading(false);
    }
    const cachedInternships = peekCompanyInternships();
    if (cachedInternships?.length) setInternships(cachedInternships);
    const cachedApps = peekCompanyApplications();
    if (cachedApps?.length) setApps(cachedApps);
  }, []);

  useEffect(() => {
    prefetchCompanyDashboardData();
  }, []);

  useEffect(() => {
    async function load() {
      const hasCachedProfile = Boolean(peekCompanyProfile());
      if (!hasCachedProfile) setLoading(true);
      try {
        setError(null);
        setSuccess(null);
        const companyContext = await fetchCompanyProfile();
        setProfile(companyContext.profile);
        setCurrentUser(companyContext.currentUser);
        if (WITH_INTERNSHIPS.has(view)) setInternships(await fetchCompanyInternships());
        if (WITH_APPS.has(view)) setApps(await fetchCompanyApplications());
        if (WITH_MATCHES.has(view)) setMatches(await fetchCompanyMatchedCandidates());
        if (WITH_MATCHES.has(view) || view === "overview" || HIRING_HUB_VIEWS.has(view)) {
          try {
            const templates = await fetchCompanyHiringScoringTemplates(true);
            if (templates.length) hiringAIEngine.configureRoleTemplates(templates);
          } catch {
            /* defaults remain active */
          }
        }
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
          setHrInsights(null);
          setAnalytics(null);
        }
        if (view === "overview" || HIRING_HUB_VIEWS.has(view)) {
          const user = companyContext.currentUser;
          const assignOk =
            (user?.permissions || []).includes("company:internship:assign") ||
            ["owner", "ceo"].includes(user?.companyAccountType || "");
          if (assignOk) {
            try {
              setRecruiters(await fetchCompanyRecruiters());
            } catch {
              setRecruiters([]);
            }
          } else if (view !== "team-recruiters") {
            setRecruiters([]);
          }
        } else if (!["team-recruiters", "analytics-company", "analytics-salary"].includes(view)) {
          setRecruiters([]);
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
    if (!PROFILE_MODAL_VIEWS.has(view)) {
      setApplicantDetailId(null);
    }
  }, [view]);

  useEffect(() => {
    if (applicantDetailId && !detailApp) setApplicantDetailId(null);
  }, [applicantDetailId, detailApp]);

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

  async function handleCancelInterview(item: ScheduledInterviewRecord) {
    try {
      setSaving(true);
      setError(null);
      await updateInterviewRound(item.applicationId, item.interviewId, { status: "rejected" });
      setApps(await fetchCompanyApplications(true));
      pushToast({
        title: "Interview cancelled",
        message: `${item.candidateName || item.role}'s ${item.interviewType || "interview"} has been cancelled.`,
        variant: "info"
      });
    } catch (e) {
      const message = (e as Error).message || "Failed to cancel interview.";
      setError(message);
      pushToast({ title: "Cancel failed", message, variant: "error" });
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

  function openApplicantProfile(applicationId: string) {
    setApplicantDetailId(applicationId);
    const application = apps.find((item) => item._id === applicationId);
    if (application) {
      setStatusDrafts((prev) => ({ ...prev, [applicationId]: normalizeApplicantStage(application.status) }));
    }
  }

  function handleMatchedMessage(_match: CompanyMatchedCandidate, _applicationId: string) {
    router.push("/dashboard/company/chat");
  }

  async function handleMatchedShortlist(applicationId: string) {
    await applyStage(applicationId, "shortlisted", "Shortlisted from AI matched candidates");
  }

  async function handleMatchedViewResume(applicationId: string) {
    try {
      setError(null);
      await openCompanyApplicationResume(applicationId);
    } catch (e) {
      openApplicantProfile(applicationId);
      setError((e as Error).message || "Resume not available. Opened candidate profile instead.");
    }
  }

  async function handleScheduleInterview(applicationId: string, slot: InterviewScheduleSlot, roundId?: string) {
    try {
      setSaving(true);
      setError(null);
      const payload = hiringAIEngine.buildInterviewPayload(slot);
      const overlaps = findOverlappingInterviews(
        extractScheduledInterviews(apps),
        payload.interviewDate,
        payload.interviewTime,
        roundId
      );
      if (overlaps.length > 0) {
        pushToast({
          title: "Overlapping interview",
          message: `This slot overlaps with ${overlaps.length} existing interview(s). Proceeding anyway.`,
          variant: "info"
        });
      }

      const application = roundId
        ? await updateInterviewRound(applicationId, roundId, {
            interviewDate: payload.interviewDate,
            interviewTime: payload.interviewTime,
            mode: payload.mode,
            ...(payload.meetingLink ? { meetingLink: payload.meetingLink } : {}),
            ...(payload.location ? { location: payload.location } : {}),
            ...(payload.notes ? { notes: payload.notes } : {})
          })
        : await scheduleInterviewRound(applicationId, payload);

      setApps((prev) => prev.map((item) => (item._id === application._id ? application : item)));
      const latestRound = roundId
        ? application.interviewRounds?.find((round) => round._id === roundId)
        : application.interviewRounds?.[application.interviewRounds.length - 1];
      const roomLink = latestRound?.meetingLink;
      pushToast({
        title: roundId ? "Interview rescheduled" : "Interview scheduled",
        message: roomLink
          ? `${payload.roundType} interview updated. Platform room: ${roomLink}`
          : `${payload.roundType} interview updated. Calendar views will refresh automatically.`,
        variant: "success"
      });
      setSuccess(roundId ? "Interview rescheduled successfully." : "Interview scheduled successfully.");
    } catch (e) {
      const message = (e as Error).message || "Failed to schedule interview.";
      setError(message);
      pushToast({ title: roundId ? "Reschedule failed" : "Scheduling failed", message, variant: "error" });
    } finally {
      setSaving(false);
    }
  }

  function renderHiringHub() {
    return (
      <HiringSection
        internships={internships}
        applications={apps}
        matches={matches}
        focus={HIRING_FOCUS_BY_VIEW[view] || "jobs"}
        isHrScoped={isHrScoped}
        saving={saving}
        canAssign={canAssign}
        recruiters={recruiters}
        selectedRecruiterByInternship={selectedRecruiterByInternship}
        onRecruiterChange={(internshipId, recruiterId) =>
          setSelectedRecruiterByInternship((prev) => ({ ...prev, [internshipId]: recruiterId }))
        }
        onAssignInternship={assignInternship}
        onDeleteInternship={removeInternship}
        onViewProfile={openApplicantProfile}
        onViewResume={handleMatchedViewResume}
        onScheduleInterview={handleScheduleInterview}
      />
    );
  }

  const viewNode: React.ReactNode = (() => {
    switch (view) {
      case "overview":
        return (
          <CompanyDashboardHub
            internships={internships}
            applications={apps}
            matches={matches}
            shortlistedCount={shortlisted.length}
            isHrScoped={isHrScoped}
            saving={saving}
            canAssign={canAssign}
            recruiters={recruiters}
            selectedRecruiterByInternship={selectedRecruiterByInternship}
            onRecruiterChange={(internshipId, recruiterId) =>
              setSelectedRecruiterByInternship((prev) => ({ ...prev, [internshipId]: recruiterId }))
            }
            onAssignInternship={assignInternship}
            onDeleteInternship={removeInternship}
            onOpenProfile={openApplicantProfile}
            onMessage={handleMatchedMessage}
            onShortlist={handleMatchedShortlist}
            onViewResume={handleMatchedViewResume}
            onScheduleInterview={handleScheduleInterview}
            onCancelInterview={handleCancelInterview}
          />
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
      case "hiring-applicants":
      case "hiring-shortlisted":
      case "hiring-pipeline":
        return renderHiringHub();
      case "matching-ai":
        return (
          <div className={companyDashboardStyles.pageStack}>
            <CompanyDashboardPageIntro
              title="AI Matched Candidates"
              subtitle="Full AI-ranked shortlist with explainable insights and one-click interview scheduling."
            />
            <MatchedCandidatesView
              matches={matches}
              applications={apps}
              internships={internships}
              defaultLimit={0}
              saving={saving}
              onOpenProfile={openApplicantProfile}
              onMessage={handleMatchedMessage}
              onShortlist={handleMatchedShortlist}
              onViewResume={handleMatchedViewResume}
              onScheduleInterview={handleScheduleInterview}
            />
          </div>
        );
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
        return <SectionPanel title="Reports / Export" subtitle={isHrScoped ? "Export your assigned hiring records." : "Export company hiring reports."}><div className="space-y-4"><div className="stat-grid sm:grid-cols-3"><div className="company-dashboard-metric-tile"><p className="ds-label">Internships</p><p className="ds-stat-value mt-1">{internships.length}</p></div><div className="company-dashboard-metric-tile"><p className="ds-label">Applicants</p><p className="ds-stat-value mt-1">{apps.length}</p></div><div className="company-dashboard-metric-tile"><p className="ds-label">Shortlisted</p><p className="ds-stat-value mt-1">{shortlisted.length}</p></div></div><div className="flex flex-wrap gap-2"><ReportDownloadButton reportKey="hiring" label="Download Hiring Report PDF" /><Button type="button" onClick={exportCsv} disabled={apps.length === 0}>Export Applicants CSV</Button></div>{apps.length === 0 && <Empty text="No applicant data available for export." />}</div></SectionPanel>;
      case "team-recruiters":
        return (
          <SectionPanel title="HR Management" subtitle="CEO controls: create HR accounts, permissions, performance insights, and removal.">
            {!canManageRecruiters || !isCeoOrOwner ? (
              <Empty text="HR management is restricted to CEO / Company Admin." />
            ) : (
              <div className="space-y-5">
                {hrInsights && (
                  <div className="stat-grid sm:grid-cols-2 lg:grid-cols-4">
                    <div className="company-dashboard-metric-tile"><p className="ds-label">HR Users</p><p className="ds-stat-value mt-1">{hrInsights.summary.totalHrUsers}</p></div>
                    <div className="company-dashboard-metric-tile"><p className="ds-label">Assigned Candidates</p><p className="ds-stat-value mt-1">{hrInsights.summary.totalAssignedCandidates}</p></div>
                    <div className="company-dashboard-metric-tile"><p className="ds-label">Total Hires</p><p className="ds-stat-value mt-1">{hrInsights.summary.totalHires}</p></div>
                    <div className="company-dashboard-metric-tile"><p className="ds-label">Avg Conversion</p><p className="ds-stat-value mt-1">{hrInsights.summary.averageConversionRate}%</p></div>
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
                <div className="stat-grid sm:grid-cols-3">
                  <div className="company-dashboard-metric-tile"><p className="ds-label">Total Hires</p><p className="ds-stat-value mt-1">{analytics.hiringAnalytics.totalHires}</p></div>
                  <div className="company-dashboard-metric-tile"><p className="ds-label">Total Applications</p><p className="ds-stat-value mt-1">{analytics.hiringAnalytics.totalApplications}</p></div>
                  <div className="company-dashboard-metric-tile"><p className="ds-label">Internship Performance</p><p className="ds-stat-value mt-1">{analytics.hiringAnalytics.internshipPerformance}</p></div>
                </div>
                <div className="company-dashboard-list-stack">
                  {analytics.recruiterPerformance.map((item) => {
                    const hrMatch = hrInsights?.hrUsers.find((hr) => hr.id === item.recruiterId);
                    const label = hrMatch ? `${hrMatch.name} (${hrMatch.email})` : `Recruiter ${item.recruiterId}`;
                    return (
                      <div key={item.recruiterId} className="company-dashboard-item-card ds-body">
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
              <div className="stat-grid sm:grid-cols-2">
                <div className="company-dashboard-metric-tile"><p className="ds-label">Average Package</p><p className="ds-stat-value mt-1">{analytics.salaryAnalytics.averagePackage}</p></div>
                <div className="company-dashboard-metric-tile"><p className="ds-label">Total Salary Expenditure</p><p className="ds-stat-value mt-1">{analytics.salaryAnalytics.totalSalaryExpenditure}</p></div>
              </div>
            )}
          </SectionPanel>
        );
      default:
        return null;
    }
  })();

  return loading ? (
    <div className="surface-muted px-4 py-3 text-sm text-slate-700 dark:text-slate-300">Loading company dashboard...</div>
  ) : (
    <div className="space-y-5 dashboard-stack">
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
          onSaveStatus={() => {
            const nextStatus = statusDrafts[detailApp._id] ?? normalizeApplicantStage(detailApp.status);
            applyStage(detailApp._id, nextStatus, "Status updated from hiring dashboard");
          }}
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
  );
}
