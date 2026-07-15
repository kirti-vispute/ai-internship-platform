"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  Award,
  BarChart3,
  BadgeCheck,
  Bookmark,
  Briefcase,
  Building2,
  Calendar,
  ChevronDown,
  ChevronUp,
  DollarSign,
  FileText,
  Globe,
  Layers,
  Link2,
  Mail,
  MapPin,
  MessageSquare,
  Percent,
  Phone,
  Search,
  ShieldAlert,
  ShieldBan,
  ShieldCheck,
  ShieldQuestion,
  StickyNote,
  Trash2,
  TrendingUp,
  UserCircle,
  UserPlus,
  Users
} from "lucide-react";
import { useChatSocket } from "@/lib/use-chat-socket";
import { SectionPanel } from "@/components/dashboard/section-panel";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { AppIcon } from "@/components/icons/app-icon";
import { cn } from "@/lib/utils";
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
  uploadCompanyLogo,
  resolveCompanyLogoUrl,
  type CompanyPersonalProfile,
  fetchPersonalProfile,
  updatePersonalProfile,
  uploadPersonalPhoto,
  searchCandidates,
  CandidateSearchResult,
  addApplicationFeedback,
  CompanyCurrentUser,
  peekCompanyApplications,
  peekCompanyInternships,
  peekCompanyProfile,
  prefetchCompanyDashboardData,
  hasSidebarModule,
  SIDEBAR_MODULE_KEYS,
  HR_DEFAULT_SIDEBAR_MODULES,
  type SidebarModuleKey
} from "@/lib/company-portal";
import { SidebarModulePicker } from "@/components/dashboard/company/sidebar-module-picker";
import { TechnologiesInput } from "@/components/dashboard/company/technologies-input";
import { CompanyLogoUploadField } from "@/components/dashboard/company/company-logo-upload-field";
import { PersonalPhotoUploadField } from "@/components/dashboard/company/personal-photo-upload-field";
import { ApplicantDetailsModal } from "@/components/dashboard/applicant-details-modal";
import { InterviewScheduleModal } from "@/components/dashboard/company/interview-schedule-modal";
import { InterviewSchedulingPanel, type InterviewScheduleTarget } from "@/components/dashboard/company/interview-scheduling-panel";
import { InterviewCalendar } from "@/components/dashboard/intern/interview-calendar";
import { ViewResumeModal } from "@/components/dashboard/company/view-resume-modal";
import { HiringSection, type HiringSectionFocus } from "@/components/dashboard/hiring";
import { CompanyDashboardHub, MatchedCandidatesView } from "@/components/dashboard/company";
import { CompanyDashboardPageIntro, companyDashboardStyles } from "@/components/dashboard/company/company-dashboard-layout";
import { hiringAIEngine, type InterviewScheduleSlot } from "@/lib/ai-hiring";
import { extractScheduledInterviews, findOverlappingInterviews, type ScheduledInterviewRecord } from "@/lib/interview-workflow";
import { useToast } from "@/components/ui/toast";
import { ReportDownloadButton } from "@/components/reports/report-download-button";
import { AccessDenied } from "@/components/dashboard/access-denied";

export type CompanyDashboardView =
  | "overview"
  | "profile"
  | "profile-edit"
  | "personal-profile"
  | "personal-profile-edit"
  | "verification"
  | "hiring-post"
  | "hiring-active"
  | "hiring-applicants"
  | "hiring-shortlisted"
  | "hiring-pipeline"
  | "hiring-interviews"
  | "hiring-calendar"
  | "matching-ai"
  | "matching-search"
  | "matching-saved"
  | "reports-feedback"
  | "reports-notes"
  | "reports-export"
  | "team-recruiters"
  | "analytics-company"
  | "analytics-salary";

/** Module required to view each route. Views absent from this map (e.g. hiring-post,
 * which is gated by the existing hardcoded HR-cannot-post rule) have no module gate. */
const VIEW_MODULE_MAP: Partial<Record<CompanyDashboardView, SidebarModuleKey | SidebarModuleKey[]>> = {
  overview: SIDEBAR_MODULE_KEYS.DASHBOARD,
  profile: SIDEBAR_MODULE_KEYS.COMPANY_PROFILE,
  "profile-edit": SIDEBAR_MODULE_KEYS.COMPANY_PROFILE,
  verification: SIDEBAR_MODULE_KEYS.VERIFICATION_STATUS,
  "hiring-active": SIDEBAR_MODULE_KEYS.INTERNSHIPS,
  "hiring-applicants": SIDEBAR_MODULE_KEYS.APPLICATIONS,
  "hiring-shortlisted": SIDEBAR_MODULE_KEYS.APPLICATIONS,
  "hiring-pipeline": SIDEBAR_MODULE_KEYS.APPLICATIONS,
  "hiring-interviews": SIDEBAR_MODULE_KEYS.INTERVIEW_SCHEDULING,
  "hiring-calendar": SIDEBAR_MODULE_KEYS.INTERVIEW_CALENDAR,
  "matching-ai": SIDEBAR_MODULE_KEYS.AI_INSIGHTS,
  "matching-search": SIDEBAR_MODULE_KEYS.CANDIDATE_SEARCH,
  "matching-saved": SIDEBAR_MODULE_KEYS.SAVED_CANDIDATES,
  "reports-feedback": SIDEBAR_MODULE_KEYS.HIRING_REPORTS,
  "reports-notes": SIDEBAR_MODULE_KEYS.HIRING_REPORTS,
  "reports-export": SIDEBAR_MODULE_KEYS.HIRING_REPORTS,
  "team-recruiters": [SIDEBAR_MODULE_KEYS.HR_MANAGEMENT, SIDEBAR_MODULE_KEYS.TEAM_MEMBERS],
  "analytics-company": SIDEBAR_MODULE_KEYS.ANALYTICS,
  "analytics-salary": SIDEBAR_MODULE_KEYS.ANALYTICS
};

function isViewAllowed(currentUser: CompanyCurrentUser | null, view: CompanyDashboardView) {
  const requirement = VIEW_MODULE_MAP[view];
  if (!requirement) return true;
  const keys = Array.isArray(requirement) ? requirement : [requirement];
  return keys.some((key) => hasSidebarModule(currentUser, key));
}

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
  "hiring-interviews",
  "hiring-calendar",
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

const PERSONAL_PROFILE_VIEWS = new Set<CompanyDashboardView>(["personal-profile", "personal-profile-edit"]);

const PROFILE_MODAL_VIEWS = new Set<CompanyDashboardView>([
  "overview",
  "matching-ai",
  "hiring-active",
  "hiring-applicants",
  "hiring-shortlisted",
  "hiring-pipeline",
  "hiring-interviews",
  "hiring-calendar"
]);

const field = "ds-input";
const fieldArea = "ds-textarea";

function Empty({ text }: { text: string }) {
  return <div className="ds-card border-dashed px-4 py-3 text-sm text-[var(--ds-muted)]">{text}</div>;
}

function InfoTile({
  label,
  value,
  icon,
  className
}: {
  label: string;
  value: React.ReactNode;
  icon?: LucideIcon;
  className?: string;
}) {
  return (
    <div className={cn("company-dashboard-metric-tile", className)}>
      <p className="ds-label flex items-center gap-1.5">
        {icon ? <AppIcon icon={icon} size="xs" className="text-[var(--ds-muted)]" /> : null}
        {label}
      </p>
      <p className="mt-1.5 break-words text-sm font-semibold text-[var(--ds-text)]">{value}</p>
    </div>
  );
}

function PermissionChip({
  label,
  checked,
  onToggle,
  disabled
}: {
  label: string;
  checked: boolean;
  onToggle: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      aria-pressed={checked}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold leading-none transition-colors duration-150",
        checked
          ? "border-[var(--ds-border-strong)] bg-[var(--ds-surface-raised)] text-[var(--ds-accent)]"
          : "border-[var(--ds-border)] text-[var(--ds-muted)] hover:border-[var(--ds-border-strong)] hover:text-[var(--ds-text)]",
        disabled && "cursor-not-allowed opacity-50"
      )}
    >
      {label}
    </button>
  );
}

const VERIFICATION_META: Record<CompanyProfile["verificationStatus"], { tone: BadgeTone; icon: LucideIcon; label: string }> = {
  verified: { tone: "success", icon: ShieldCheck, label: "Verified" },
  pending: { tone: "warning", icon: ShieldQuestion, label: "Pending Review" },
  rejected: { tone: "danger", icon: ShieldAlert, label: "Rejected" },
  suspended: { tone: "danger", icon: ShieldBan, label: "Suspended" }
};

function fmtDate(value?: string) {
  if (!value) return "-";
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return "-";
  return dt.toLocaleDateString("en-IN");
}


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
  const [hrFormModules, setHrFormModules] = useState<string[]>([...HR_DEFAULT_SIDEBAR_MODULES]);
  const [selectedHrId, setSelectedHrId] = useState<string | null>(null);
  const [permissionDraft, setPermissionDraft] = useState<string[]>([]);
  const [moduleDraft, setModuleDraft] = useState<string[]>([]);
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
  const [resumeModalApplicationId, setResumeModalApplicationId] = useState<string | null>(null);
  const [applicantScheduleTarget, setApplicantScheduleTarget] = useState<InterviewScheduleTarget | null>(null);
  const [statusDrafts, setStatusDrafts] = useState<Record<string, string>>({});
  const [feedbackDrafts, setFeedbackDrafts] = useState<Record<string, { feedback: string; rating: number; visibility: "internal" | "candidate" }>>({});

  const [profileForm, setProfileForm] = useState({
    companyName: "",
    contactName: "",
    phone: "",
    website: "",
    address: "",
    description: "",
    industry: "",
    companySize: "",
    headquarters: "",
    foundedYear: "",
    technologies: [] as string[],
    hiringProcessOverview: ""
  });
  const [technologiesError, setTechnologiesError] = useState<string | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);

  const [personalProfile, setPersonalProfile] = useState<CompanyPersonalProfile | null>(null);
  const [personalProfileForm, setPersonalProfileForm] = useState({
    displayName: "",
    phone: "",
    designation: "",
    linkedInUrl: "",
    personalWebsite: "",
    bio: ""
  });
  const [personalSaving, setPersonalSaving] = useState(false);
  const [personalPhotoUploading, setPersonalPhotoUploading] = useState(false);
  const [personalPhotoError, setPersonalPhotoError] = useState<string | null>(null);
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
        if (!isViewAllowed(companyContext.currentUser, view)) {
          return;
        }
        if (WITH_INTERNSHIPS.has(view)) setInternships(await fetchCompanyInternships());
        if (WITH_APPS.has(view)) setApps(await fetchCompanyApplications());
        if (WITH_MATCHES.has(view)) setMatches(await fetchCompanyMatchedCandidates());
        if (PERSONAL_PROFILE_VIEWS.has(view) && ["owner", "ceo"].includes(companyContext.currentUser?.companyAccountType || "")) {
          setPersonalProfile(await fetchPersonalProfile());
        }
        if (WITH_MATCHES.has(view) || view === "overview" || HIRING_HUB_VIEWS.has(view)) {
          try {
            const templates = await fetchCompanyHiringScoringTemplates(true);
            if (templates.length) hiringAIEngine.configureRoleTemplates(templates);
          } catch {
            /* defaults remain active */
          }
        }
        if (["team-recruiters", "analytics-company", "analytics-salary"].includes(view)) {
          const isExecutive = ["owner", "ceo"].includes(companyContext.currentUser?.companyAccountType || "");
          const insights =
            isExecutive && (view === "team-recruiters" || view === "analytics-company")
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

  // Interview scheduled/rescheduled/cancelled/completed pushes a socket
  // notification to company stakeholders; refetch applications so the
  // interview calendar and scheduling panel reflect it live, mirroring the
  // intern-side pattern in app/dashboard/intern/interviews/page.tsx.
  const interviewRefetchTimerRef = useRef<number | null>(null);
  useChatSocket({
    onNotification: (notification) => {
      const type = String((notification as { type?: string })?.type || "");
      if (!type.includes("interview")) return;
      if (interviewRefetchTimerRef.current) window.clearTimeout(interviewRefetchTimerRef.current);
      interviewRefetchTimerRef.current = window.setTimeout(() => {
        fetchCompanyApplications(true)
          .then(setApps)
          .catch(() => undefined);
      }, 400);
    }
  });

  useEffect(() => {
    return () => {
      if (interviewRefetchTimerRef.current) window.clearTimeout(interviewRefetchTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!profile) return;
    setProfileForm({
      companyName: profile.companyName || "",
      contactName: profile.contactName || "",
      phone: profile.phone || "",
      website: profile.website || "",
      address: profile.address || "",
      description: profile.description || "",
      industry: profile.industry || "",
      companySize: profile.companySize || "",
      headquarters: profile.headquarters || "",
      foundedYear: profile.foundedYear ? String(profile.foundedYear) : "",
      technologies: profile.technologies || [],
      hiringProcessOverview: profile.hiringProcessOverview || ""
    });
  }, [profile]);

  useEffect(() => {
    if (!personalProfile) return;
    setPersonalProfileForm({
      displayName: personalProfile.displayName || "",
      phone: personalProfile.phone || "",
      designation: personalProfile.designation || "",
      linkedInUrl: personalProfile.linkedInUrl || "",
      personalWebsite: personalProfile.personalWebsite || "",
      bio: personalProfile.bio || ""
    });
  }, [personalProfile]);

  useEffect(() => {
    if (view !== "matching-search") return;
    const timer = window.setTimeout(() => setDebouncedQuery(query.trim()), 350);
    return () => window.clearTimeout(timer);
  }, [query, view]);

  useEffect(() => {
    if (view !== "matching-search") return;
    if (!isViewAllowed(currentUser, view)) return;

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
        permissions: hrFormPermissions,
        sidebarModules: hrFormModules
      });
      setHrForm({ name: "", email: "", password: "" });
      setHrFormPermissions([...HR_ASSIGNABLE_PERMISSIONS]);
      setHrFormModules([...HR_DEFAULT_SIDEBAR_MODULES]);
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
    setModuleDraft(hr.sidebarModules?.length ? [...hr.sidebarModules] : [...HR_DEFAULT_SIDEBAR_MODULES]);
  }

  async function handleSaveHrPermissions(hrId: string) {
    try {
      setHrActionLoading(true);
      setError(null);
      await updateCompanyHrPermissions(hrId, permissionDraft, moduleDraft);
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
  const resumeModalApp = useMemo(
    () => (resumeModalApplicationId ? apps.find((application) => application._id === resumeModalApplicationId) ?? null : null),
    [apps, resumeModalApplicationId]
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
    if (profileForm.technologies.length === 0) {
      setTechnologiesError("Select at least one technology before saving.");
      return;
    }
    setTechnologiesError(null);
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

  async function handleLogoSelect(file: File) {
    try {
      setLogoUploading(true);
      setLogoError(null);
      const updated = await uploadCompanyLogo(file);
      setProfile(updated);
      setSuccess("Company logo updated.");
    } catch (e) {
      setLogoError((e as Error).message || "Failed to upload logo.");
    } finally {
      setLogoUploading(false);
    }
  }

  async function savePersonalProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      setPersonalSaving(true);
      setError(null);
      const updated = await updatePersonalProfile(personalProfileForm);
      setPersonalProfile(updated);
      setSuccess("Personal information updated.");
    } catch (e) {
      setError((e as Error).message || "Failed to update personal information.");
    } finally {
      setPersonalSaving(false);
    }
  }

  async function handlePersonalPhotoSelect(file: File) {
    try {
      setPersonalPhotoUploading(true);
      setPersonalPhotoError(null);
      const updated = await uploadPersonalPhoto(file);
      setPersonalProfile(updated);
      setSuccess("Profile photo updated.");
    } catch (e) {
      setPersonalPhotoError((e as Error).message || "Failed to upload photo.");
    } finally {
      setPersonalPhotoUploading(false);
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


  async function handleCancelInterview(item: ScheduledInterviewRecord) {
    try {
      setSaving(true);
      setError(null);
      // Cancelling a round only changes the round's own status — it must not
      // force-reject the whole application (that used to be conflated).
      await updateInterviewRound(item.applicationId, item.interviewId, { status: "cancelled" });
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

  async function handleUpdateInterviewRoundStatus(item: ScheduledInterviewRecord, status: "completed" | "cancelled" | "no_show") {
    try {
      setSaving(true);
      setError(null);
      await updateInterviewRound(item.applicationId, item.interviewId, { status });
      setApps(await fetchCompanyApplications(true));
      const labels: Record<typeof status, string> = {
        completed: "marked completed",
        cancelled: "cancelled",
        no_show: "marked as a no-show"
      };
      pushToast({
        title: `Interview ${labels[status]}`,
        message: `${item.candidateName || item.role}'s ${item.interviewType || "interview"} was ${labels[status]}.`,
        variant: status === "completed" ? "success" : "info"
      });
    } catch (e) {
      const message = (e as Error).message || "Failed to update interview.";
      setError(message);
      pushToast({ title: "Update failed", message, variant: "error" });
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

  function handleMatchedViewResume(applicationId: string) {
    setResumeModalApplicationId(applicationId);
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
            ...(payload.durationMinutes ? { durationMinutes: payload.durationMinutes } : {}),
            ...(payload.timezone ? { timezone: payload.timezone } : {}),
            ...(payload.interviewers ? { interviewers: payload.interviewers } : {}),
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

  const viewAllowed = isViewAllowed(currentUser, view);

  const viewNode: React.ReactNode = (() => {
    if (!viewAllowed) {
      return <AccessDenied hint="Your Company Admin hasn't enabled this module for your account. Ask them to update your permissions." />;
    }
    switch (view) {
      case "overview":
        return (
          <CompanyDashboardHub
            internships={internships}
            applications={apps}
            matches={matches}
            shortlistedCount={shortlisted.length}
            isHrScoped={isHrScoped}
            currentUser={currentUser}
            saving={saving}
            onOpenProfile={openApplicantProfile}
            onMessage={handleMatchedMessage}
            onShortlist={handleMatchedShortlist}
            onViewResume={handleMatchedViewResume}
            onScheduleInterview={handleScheduleInterview}
            onCancelInterview={handleCancelInterview}
            onUpdateInterviewRoundStatus={handleUpdateInterviewRoundStatus}
          />
        );
      case "profile": {
        const verMeta = profile ? VERIFICATION_META[profile.verificationStatus] : null;
        return (
          <div className={companyDashboardStyles.pageStack}>
            <CompanyDashboardPageIntro title="Company Profile" subtitle="Public-facing company information shown to candidates." />
            {!profile ? (
              <Empty text="Company profile not available." />
            ) : (
              <div className="space-y-4">
                <Card className="!p-0 overflow-hidden">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--ds-border)] px-5 py-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <Avatar name={profile.companyName} src={resolveCompanyLogoUrl(profile.logoUrl) || undefined} size="lg" />
                      <div className="min-w-0">
                        <h2 className="ds-h3 truncate">{profile.companyName || "Company"}</h2>
                        <p className="ds-caption truncate">{profile.industry || "Industry not set"}</p>
                      </div>
                    </div>
                    {verMeta ? (
                      <Badge tone={verMeta.tone} icon={verMeta.icon}>
                        {verMeta.label}
                      </Badge>
                    ) : null}
                  </div>
                  <div className="grid gap-3 p-5 sm:grid-cols-2">
                    <InfoTile icon={Mail} label="Email" value={profile.companyEmail || "-"} />
                    <InfoTile icon={Phone} label="Phone" value={profile.phone || "-"} />
                    <InfoTile icon={Users} label="Contact" value={profile.contactName || "-"} />
                    <InfoTile icon={Building2} label="GST" value={profile.gst || "-"} />
                    <InfoTile icon={Globe} label="Website" value={profile.website || "-"} />
                    <InfoTile icon={MapPin} label="Headquarters" value={profile.headquarters || "-"} />
                    <InfoTile icon={Users} label="Company Size" value={profile.companySize || "-"} />
                    <InfoTile icon={Calendar} label="Founded" value={profile.foundedYear || "-"} />
                  </div>
                </Card>

                <Card title="Location & Overview" titleIcon={MapPin}>
                  <div className="grid gap-3">
                    <InfoTile label="Address" value={profile.address || "-"} />
                    <InfoTile label="Description" value={profile.description || "-"} />
                    <InfoTile label="Hiring Process Overview" value={profile.hiringProcessOverview || "-"} />
                  </div>
                </Card>

                <Card title="Technology Stack" titleIcon={Layers}>
                  {(profile.technologies || []).length === 0 ? (
                    <p className="ds-caption">No technologies listed.</p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {profile.technologies!.map((tech) => (
                        <Badge key={tech} tone="neutral">
                          {tech}
                        </Badge>
                      ))}
                    </div>
                  )}
                </Card>
              </div>
            )}
          </div>
        );
      }
      case "profile-edit":
        return (
          <div className={companyDashboardStyles.pageStack}>
            <CompanyDashboardPageIntro
              title="Edit Company Profile"
              subtitle="Update profile information. Shown publicly to students on your company profile page."
            />
            {isHrScoped ? (
              <Empty text="Editing the company profile is restricted to CEO / Company Admin." />
            ) : (
            <form className="space-y-6" onSubmit={saveProfile}>
              <Card title="Company Logo" titleIcon={Building2}>
                <CompanyLogoUploadField
                  logoUrl={profile?.logoUrl}
                  companyName={profile?.companyName}
                  uploading={logoUploading}
                  error={logoError}
                  onSelect={handleLogoSelect}
                />
              </Card>

              <Card title="Company Details" titleIcon={Building2}>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <input className={field} placeholder="Company Name" value={profileForm.companyName} onChange={(e) => setProfileForm((p) => ({ ...p, companyName: e.target.value }))} />
                  <input className={field} placeholder="Contact Name" value={profileForm.contactName} onChange={(e) => setProfileForm((p) => ({ ...p, contactName: e.target.value }))} />
                  <input className={field} placeholder="Phone" value={profileForm.phone} onChange={(e) => setProfileForm((p) => ({ ...p, phone: e.target.value }))} />
                  <input className={field} placeholder="Website" value={profileForm.website} onChange={(e) => setProfileForm((p) => ({ ...p, website: e.target.value }))} />
                  <input className={field} placeholder="Industry" value={profileForm.industry} onChange={(e) => setProfileForm((p) => ({ ...p, industry: e.target.value }))} />
                </div>
              </Card>

              <Card title="Size & Location" titleIcon={MapPin}>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <input className={field} placeholder="Company Size (e.g. 51-200 employees)" value={profileForm.companySize} onChange={(e) => setProfileForm((p) => ({ ...p, companySize: e.target.value }))} />
                  <input className={field} placeholder="Headquarters (city, country)" value={profileForm.headquarters} onChange={(e) => setProfileForm((p) => ({ ...p, headquarters: e.target.value }))} />
                  <input type="number" className={field} placeholder="Founded Year" value={profileForm.foundedYear} onChange={(e) => setProfileForm((p) => ({ ...p, foundedYear: e.target.value }))} />
                  <input className={`${field} sm:col-span-2 lg:col-span-3`} placeholder="Address" value={profileForm.address} onChange={(e) => setProfileForm((p) => ({ ...p, address: e.target.value }))} />
                </div>
              </Card>

              <Card title="About & Hiring" titleIcon={Layers}>
                <div className="grid gap-3">
                  <div>
                    <p className="ds-label mb-1.5">
                      Technologies <span className="text-rose-400">*</span>
                    </p>
                    <TechnologiesInput
                      value={profileForm.technologies}
                      onChange={(next) => {
                        setProfileForm((p) => ({ ...p, technologies: next }));
                        if (next.length > 0) setTechnologiesError(null);
                      }}
                      error={technologiesError}
                      disabled={saving}
                    />
                  </div>
                  <textarea className={`${fieldArea} min-h-28`} placeholder="Description" value={profileForm.description} onChange={(e) => setProfileForm((p) => ({ ...p, description: e.target.value }))} />
                  <textarea
                    className={`${fieldArea} min-h-20`}
                    placeholder="Hiring Process Overview (e.g. Application -> Screening -> Technical round -> Offer)"
                    value={profileForm.hiringProcessOverview}
                    onChange={(e) => setProfileForm((p) => ({ ...p, hiringProcessOverview: e.target.value }))}
                  />
                </div>
              </Card>

              <Button type="submit" disabled={saving}>
                {saving ? "Saving..." : "Save Profile"}
              </Button>
            </form>
            )}
          </div>
        );
      case "personal-profile": {
        return (
          <div className={companyDashboardStyles.pageStack}>
            <CompanyDashboardPageIntro title="Personal Information" subtitle="Your own details as the account holder. Not shown on the company's public profile." />
            {!isCeoOrOwner ? (
              <Empty text="Personal Information is available to CEO / Company Admin only." />
            ) : !personalProfile ? (
              <Empty text="Personal information not available." />
            ) : (
              <div className="space-y-4">
                <Card className="!p-0 overflow-hidden">
                  <div className="flex flex-wrap items-center gap-3 border-b border-[var(--ds-border)] px-5 py-4">
                    <Avatar name={personalProfile.displayName || personalProfile.email} src={resolveCompanyLogoUrl(personalProfile.photoUrl) || undefined} size="lg" />
                    <div className="min-w-0">
                      <h2 className="ds-h3 truncate">{personalProfile.displayName || "Unnamed"}</h2>
                      <p className="ds-caption truncate">{personalProfile.designation || "Designation not set"}</p>
                    </div>
                  </div>
                  <div className="grid gap-3 p-5 sm:grid-cols-2">
                    <InfoTile icon={Mail} label="Email" value={personalProfile.email || "-"} />
                    <InfoTile icon={Phone} label="Phone" value={personalProfile.phone || "-"} />
                    <InfoTile icon={Briefcase} label="Designation" value={personalProfile.designation || "-"} />
                    <InfoTile icon={Link2} label="LinkedIn" value={personalProfile.linkedInUrl || "-"} />
                    <InfoTile icon={Globe} label="Personal Website" value={personalProfile.personalWebsite || "-"} />
                  </div>
                </Card>
                <Card title="Bio" titleIcon={FileText}>
                  <p className="ds-body">{personalProfile.bio || "-"}</p>
                </Card>
              </div>
            )}
          </div>
        );
      }
      case "personal-profile-edit":
        return (
          <div className={companyDashboardStyles.pageStack}>
            <CompanyDashboardPageIntro title="Edit Personal Information" subtitle="Update your own name, contact details, and bio. Kept separate from the company's public profile." />
            {!isCeoOrOwner ? (
              <Empty text="Personal Information is available to CEO / Company Admin only." />
            ) : (
              <form className="space-y-6" onSubmit={savePersonalProfile}>
                <Card title="Profile Photo" titleIcon={UserCircle}>
                  <PersonalPhotoUploadField
                    photoUrl={personalProfile?.photoUrl}
                    displayName={personalProfile?.displayName}
                    uploading={personalPhotoUploading}
                    error={personalPhotoError}
                    onSelect={handlePersonalPhotoSelect}
                  />
                </Card>

                <Card title="Personal Details" titleIcon={UserCircle}>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <input className={field} placeholder="Full Name" value={personalProfileForm.displayName} onChange={(e) => setPersonalProfileForm((p) => ({ ...p, displayName: e.target.value }))} />
                    <input className={field} placeholder="Phone" value={personalProfileForm.phone} onChange={(e) => setPersonalProfileForm((p) => ({ ...p, phone: e.target.value }))} />
                    <input className={field} placeholder="Designation (e.g. Founder & CEO)" value={personalProfileForm.designation} onChange={(e) => setPersonalProfileForm((p) => ({ ...p, designation: e.target.value }))} />
                    <input className={field} placeholder="LinkedIn URL" value={personalProfileForm.linkedInUrl} onChange={(e) => setPersonalProfileForm((p) => ({ ...p, linkedInUrl: e.target.value }))} />
                    <input className={field} placeholder="Personal Website" value={personalProfileForm.personalWebsite} onChange={(e) => setPersonalProfileForm((p) => ({ ...p, personalWebsite: e.target.value }))} />
                  </div>
                </Card>

                <Card title="Bio" titleIcon={FileText}>
                  <textarea className={`${fieldArea} min-h-28`} placeholder="A short bio about yourself" value={personalProfileForm.bio} onChange={(e) => setPersonalProfileForm((p) => ({ ...p, bio: e.target.value }))} />
                </Card>

                <Button type="submit" disabled={personalSaving}>
                  {personalSaving ? "Saving..." : "Save Personal Information"}
                </Button>
              </form>
            )}
          </div>
        );
      case "verification": {
        const status = summary.verification as CompanyProfile["verificationStatus"];
        const verMeta = VERIFICATION_META[status] || VERIFICATION_META.pending;
        const VERIFICATION_COPY: Record<CompanyProfile["verificationStatus"], string> = {
          verified: "Your company is verified. Candidates can see the verified badge on your listings and profile.",
          pending: "Your company is awaiting review by the InternAI team. This usually takes 1-2 business days.",
          rejected: "Your verification request was rejected. Update your company profile details and contact support.",
          suspended: "Your company account has been suspended. Contact support to resolve this."
        };
        const documentChecklist = [
          { label: "Business Registration Proof", present: Boolean(profile?.businessRegistrationProofUrl) },
          { label: "HR Identity Proof", present: Boolean(profile?.hrIdentityProofUrl) },
          { label: "Additional Verification Documents", present: Boolean(profile?.verificationDocuments?.length) }
        ];
        return (
          <div className={companyDashboardStyles.pageStack}>
            <CompanyDashboardPageIntro title="Verification Status" subtitle="Current verification state of your company account." />
            {!profile ? (
              <Empty text="Company profile not available." />
            ) : (
              <div className="space-y-4">
                <Card className={cn("!p-0 overflow-hidden border-2", verMeta.tone === "success" ? "border-[var(--ds-success)]" : "border-[var(--ds-border-strong)]")}>
                  <div className="flex flex-col gap-5 bg-[var(--ds-surface-raised)] px-6 py-7 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-center gap-4">
                      <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-[var(--ds-border)] bg-[var(--ds-surface)] shadow-sm">
                        <AppIcon icon={verMeta.icon} size="lg" className="text-[var(--ds-accent)]" />
                      </span>
                      <div className="min-w-0">
                        <p className="ds-label">Company Verification</p>
                        <h2 className="ds-h2 truncate">{verMeta.label}</h2>
                        <p className="ds-body mt-1 max-w-xl">{VERIFICATION_COPY[status] || VERIFICATION_COPY.pending}</p>
                      </div>
                    </div>
                    <Badge tone={verMeta.tone} icon={verMeta.icon} className="!text-sm shrink-0 self-start px-3 py-1.5 sm:self-center">
                      {verMeta.label}
                    </Badge>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 border-t border-[var(--ds-border)] px-6 py-4">
                    <Avatar name={profile.companyName} src={resolveCompanyLogoUrl(profile.logoUrl) || undefined} size="md" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[var(--ds-text)] truncate">{profile.companyName || "Company"}</p>
                      <p className="ds-caption truncate">{profile.industry || "Industry not set"}</p>
                    </div>
                  </div>

                  <div className="grid gap-3 border-t border-[var(--ds-border)] p-6 sm:grid-cols-2 lg:grid-cols-3">
                    <InfoTile icon={ShieldCheck} label="Verification Level" value={status === "verified" ? "Verified Business" : "Standard"} />
                    <InfoTile icon={Calendar} label="Verified On" value={profile.verifiedBadgeIssuedAt ? fmtDate(profile.verifiedBadgeIssuedAt) : "-"} />
                    <InfoTile icon={Building2} label="GST" value={profile.gst || "-"} />
                    {status === "rejected" && profile.rejectionReason ? (
                      <InfoTile icon={ShieldAlert} label="Rejection Reason" value={profile.rejectionReason} className="sm:col-span-2 lg:col-span-3" />
                    ) : null}
                  </div>
                </Card>

                <Card title="Verification Checklist" titleIcon={BadgeCheck}>
                  <div className="grid gap-2.5 sm:grid-cols-3">
                    {documentChecklist.map((item) => (
                      <div key={item.label} className="flex items-center gap-2 rounded-[var(--ds-radius-sm)] border border-[var(--ds-border)] px-3 py-2.5">
                        <AppIcon
                          icon={item.present ? ShieldCheck : ShieldQuestion}
                          size="sm"
                          className={item.present ? "text-[var(--ds-success)]" : "text-[var(--ds-muted)]"}
                        />
                        <span className="text-sm text-[var(--ds-text)]">{item.label}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            )}
          </div>
        );
      }
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
              <Card title="Basic Internship Information">
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
              </Card>

              <Card title="Compensation & Openings">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <input className={field} placeholder="Stipend" value={postForm.stipend} onChange={(e) => setPostForm((p) => ({ ...p, stipend: e.target.value }))} />
                  <input className={field} placeholder="Perks / Benefits" value={postForm.perks} onChange={(e) => setPostForm((p) => ({ ...p, perks: e.target.value }))} />
                  <input type="number" min={1} className={field} placeholder="Number of Openings" value={postForm.openings} onChange={(e) => setPostForm((p) => ({ ...p, openings: e.target.value }))} />
                </div>
              </Card>

              <Card title="Role Information">
                <div className="grid gap-3 sm:grid-cols-2">
                  <textarea className={`${fieldArea} min-h-24 sm:col-span-2`} placeholder="Job Description" value={postForm.description} onChange={(e) => setPostForm((p) => ({ ...p, description: e.target.value }))} />
                  <textarea className={`${fieldArea} min-h-24 sm:col-span-2`} placeholder="Roles & Responsibilities" value={postForm.responsibilities} onChange={(e) => setPostForm((p) => ({ ...p, responsibilities: e.target.value }))} />
                  <input className={field} placeholder="Required Skills (comma separated)" value={postForm.skillsRequired} onChange={(e) => setPostForm((p) => ({ ...p, skillsRequired: e.target.value }))} />
                  <input className={field} placeholder="Preferred Skills (comma separated)" value={postForm.prioritySkills} onChange={(e) => setPostForm((p) => ({ ...p, prioritySkills: e.target.value }))} />
                  <textarea className={`${fieldArea} min-h-20 sm:col-span-2`} placeholder="Eligibility Criteria" value={postForm.eligibilityCriteria} onChange={(e) => setPostForm((p) => ({ ...p, eligibilityCriteria: e.target.value }))} />
                </div>
              </Card>

              <Card title="Candidate Preferences & Process">
                <div className="grid gap-3 sm:grid-cols-2">
                  <input className={field} placeholder="Education Qualification" value={postForm.educationQualification} onChange={(e) => setPostForm((p) => ({ ...p, educationQualification: e.target.value }))} />
                  <input className={field} placeholder="Branch / Degree Preferences" value={postForm.degreePreferences} onChange={(e) => setPostForm((p) => ({ ...p, degreePreferences: e.target.value }))} />
                  <input className={field} placeholder="Minimum CGPA (if applicable)" value={postForm.minimumCgpa} onChange={(e) => setPostForm((p) => ({ ...p, minimumCgpa: e.target.value }))} />
                  <input className={field} placeholder="Experience Requirement" value={postForm.experienceRequirement} onChange={(e) => setPostForm((p) => ({ ...p, experienceRequirement: e.target.value }))} />
                  <textarea className={`${fieldArea} min-h-20 sm:col-span-2`} placeholder="Selection Process" value={postForm.selectionProcess} onChange={(e) => setPostForm((p) => ({ ...p, selectionProcess: e.target.value }))} />
                  <textarea className={`${fieldArea} min-h-20 sm:col-span-2`} placeholder="Interview Rounds" value={postForm.interviewRoundsInfo} onChange={(e) => setPostForm((p) => ({ ...p, interviewRoundsInfo: e.target.value }))} />
                  <textarea className={`${fieldArea} min-h-20 sm:col-span-2`} placeholder="Additional Instructions" value={postForm.additionalInstructions} onChange={(e) => setPostForm((p) => ({ ...p, additionalInstructions: e.target.value }))} />
                  <input className={`${field} sm:col-span-2`} placeholder="HR Contact Details" value={postForm.hrContact} onChange={(e) => setPostForm((p) => ({ ...p, hrContact: e.target.value }))} />
                </div>
              </Card>

              <Button type="submit" disabled={saving}>{saving ? "Posting..." : "Publish Internship"}</Button>
            </form>
          </SectionPanel>
        );
      case "hiring-active":
      case "hiring-applicants":
      case "hiring-shortlisted":
      case "hiring-pipeline":
        return renderHiringHub();
      case "hiring-interviews": {
        return (
          <div className={companyDashboardStyles.pageStack}>
            <CompanyDashboardPageIntro
              title="Interviews"
              subtitle="Coordinate interview rounds, track statuses, and keep candidates moving through the pipeline."
            />
            <InterviewSchedulingPanel
              applications={apps}
              saving={saving}
              onViewProfile={openApplicantProfile}
              onScheduleInterview={setApplicantScheduleTarget}
              onCancelInterview={handleCancelInterview}
              onUpdateRoundStatus={handleUpdateInterviewRoundStatus}
            />
          </div>
        );
      }
      case "hiring-calendar": {
        return (
          <div className={companyDashboardStyles.pageStack}>
            <CompanyDashboardPageIntro
              title="Calendar"
              subtitle="Every scheduled interview across your pipeline, at a glance."
            />
            <InterviewCalendar applications={apps} audience="company" onViewProfile={openApplicantProfile} />
          </div>
        );
      }
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
              isHrScoped={isHrScoped}
              onOpenProfile={openApplicantProfile}
              onMessage={handleMatchedMessage}
              onShortlist={handleMatchedShortlist}
              onViewResume={handleMatchedViewResume}
              onScheduleInterview={handleScheduleInterview}
            />
          </div>
        );
      case "matching-search": {
        const scoreTone = (score: number): BadgeTone => (score >= 80 ? "success" : score >= 60 ? "accent" : "neutral");
        return (
          <div className={companyDashboardStyles.pageStack}>
            <CompanyDashboardPageIntro title="Candidate Search" subtitle="Search the full candidate pool by name or email." />
            <Card>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--ds-muted)]" aria-hidden />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by name or email"
                  className={`${field} w-full pl-10`}
                />
              </div>

              <div className="mt-4">
                {searchLoading && <Empty text="Searching candidates..." />}

                {!searchLoading && searchError && (
                  <div className="ds-alert ds-alert--error">{searchError}</div>
                )}

                {!searchLoading && !searchError && !debouncedQuery && (
                  <Empty text="Type a candidate name or email to search." />
                )}

                {!searchLoading && !searchError && debouncedQuery && searchResults.length === 0 && (
                  <Empty text="No candidates found for this search." />
                )}

                {!searchLoading && !searchError && searchResults.length > 0 && (
                  <div className="company-dashboard-list-stack">
                    {searchResults.map((candidate) => (
                      <div key={candidate._id} className="company-dashboard-item-card !flex-row flex-wrap items-center justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <Avatar name={candidate.fullName} size="sm" />
                          <div className="min-w-0">
                            <p className="ds-h3 truncate">{candidate.fullName || "Candidate"}</p>
                            <p className="ds-caption truncate">{candidate.email || "No email"} · {candidate.mobile || "No mobile"}</p>
                          </div>
                        </div>
                        <Badge tone={scoreTone(candidate.resumeScore || 0)}>Resume {candidate.resumeScore || 0}/100</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </div>
        );
      }
      case "matching-saved":
        return (
          <div className={companyDashboardStyles.pageStack}>
            <CompanyDashboardPageIntro title="Saved Candidates" subtitle="Bookmarked shortlist for quick access later." />
            <div className="company-dashboard-empty">
              <span className="ds-stat-icon mx-auto mb-3">
                <AppIcon icon={Bookmark} size="lg" />
              </span>
              <p className="ds-h3">No saved candidates yet.</p>
              <p className="ds-caption mt-1">Bookmark candidates from Matching or Applicants to see them here.</p>
            </div>
          </div>
        );
      case "reports-feedback": {
        const feedback = apps
          .flatMap((a) => (a.hrFeedback || []).map((f, idx) => ({ id: `${a._id}-${idx}`, name: a.intern?.fullName || "Candidate", role: a.internship?.role || "Internship", text: f.feedback, createdAt: f.createdAt })))
          .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        return (
          <div className={companyDashboardStyles.pageStack}>
            <CompanyDashboardPageIntro title="Feedback" subtitle="Collected HR feedback on applications." />
            {feedback.length === 0 ? (
              <Empty text="No feedback added yet." />
            ) : (
              <div className="company-dashboard-list-stack">
                {feedback.map((f) => (
                  <div key={f.id} className="company-dashboard-item-card">
                    <div className="flex items-start gap-3">
                      <span className="ds-stat-icon shrink-0">
                        <AppIcon icon={MessageSquare} size="sm" />
                      </span>
                      <div className="min-w-0">
                        <p className="ds-h3">{f.name}</p>
                        <p className="ds-caption">{f.role} · {fmtDate(f.createdAt)}</p>
                        <p className="ds-body mt-1.5">{f.text}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      }
      case "reports-notes": {
        const notes = apps
          .flatMap((a) => (a.stageHistory || []).filter((h) => h.note?.trim()).map((h, idx) => ({ id: `${a._id}-${idx}`, name: a.intern?.fullName || "Candidate", role: a.internship?.role || "Internship", stage: h.stage, note: h.note, changedAt: h.changedAt })))
          .sort((a, b) => new Date(b.changedAt || 0).getTime() - new Date(a.changedAt || 0).getTime());
        return (
          <div className={companyDashboardStyles.pageStack}>
            <CompanyDashboardPageIntro title="Hiring Notes" subtitle="Stage notes captured in pipeline updates." />
            {notes.length === 0 ? (
              <Empty text="No hiring notes available yet." />
            ) : (
              <div className="company-dashboard-list-stack">
                {notes.map((n) => (
                  <div key={n.id} className="company-dashboard-item-card">
                    <div className="flex items-start gap-3">
                      <span className="ds-stat-icon shrink-0">
                        <AppIcon icon={StickyNote} size="sm" />
                      </span>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="ds-h3">{n.name}</p>
                          <Badge tone="neutral" className="capitalize">
                            {String(n.stage || "").replace(/_/g, " ")}
                          </Badge>
                        </div>
                        <p className="ds-caption mt-0.5">{n.role} · {fmtDate(n.changedAt)}</p>
                        <p className="ds-body mt-1.5">{n.note}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      }
      case "reports-export":
        return (
          <div className={companyDashboardStyles.pageStack}>
            <CompanyDashboardPageIntro
              title="Reports / Export"
              subtitle={isHrScoped ? "Export your assigned hiring records." : "Export company hiring reports."}
            />
            <Card>
              <div className="stat-grid">
                <InfoTile label="Internships" value={<span className="ds-stat-value">{internships.length}</span>} />
                <InfoTile label="Applicants" value={<span className="ds-stat-value">{apps.length}</span>} />
                <InfoTile label="Shortlisted" value={<span className="ds-stat-value">{shortlisted.length}</span>} />
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <ReportDownloadButton reportKey="hiring" label="Download Hiring Report PDF" />
                <Button type="button" variant="secondary" onClick={exportCsv} disabled={apps.length === 0}>
                  Export Applicants CSV
                </Button>
              </div>
              {apps.length === 0 && <div className="mt-4"><Empty text="No applicant data available for export." /></div>}
            </Card>
          </div>
        );
      case "team-recruiters":
        return (
          <div className={companyDashboardStyles.pageStack}>
            <CompanyDashboardPageIntro title="HR Management" subtitle="CEO controls: create HR accounts, permissions, performance insights, and removal." />
            {!canManageRecruiters || !isCeoOrOwner ? (
              <Empty text="HR management is restricted to CEO / Company Admin." />
            ) : (
              <div className="space-y-5">
                {hrInsights && (
                  <div className="stat-grid">
                    <InfoTile icon={Users} label="HR Users" value={<span className="ds-stat-value">{hrInsights.summary.totalHrUsers}</span>} />
                    <InfoTile icon={UserPlus} label="Assigned Candidates" value={<span className="ds-stat-value">{hrInsights.summary.totalAssignedCandidates}</span>} />
                    <InfoTile icon={Award} label="Total Hires" value={<span className="ds-stat-value">{hrInsights.summary.totalHires}</span>} />
                    <InfoTile icon={Percent} label="Avg Conversion" value={<span className="ds-stat-value">{hrInsights.summary.averageConversionRate}%</span>} />
                  </div>
                )}

                <Card title="Add HR User" titleIcon={UserPlus}>
                  <div className="space-y-4">
                    <div className="grid gap-3 sm:grid-cols-3">
                      <input className={field} placeholder="Full name" value={hrForm.name} onChange={(e) => setHrForm((p) => ({ ...p, name: e.target.value }))} />
                      <input className={field} placeholder="Email" type="email" value={hrForm.email} onChange={(e) => setHrForm((p) => ({ ...p, email: e.target.value }))} />
                      <input className={field} placeholder="Password (min 8 chars)" type="password" value={hrForm.password} onChange={(e) => setHrForm((p) => ({ ...p, password: e.target.value }))} />
                    </div>
                    <div>
                      <p className="ds-label mb-2">Permissions</p>
                      <div className="flex flex-wrap gap-2">
                        {HR_ASSIGNABLE_PERMISSIONS.map((perm) => (
                          <PermissionChip
                            key={perm}
                            label={perm}
                            checked={hrFormPermissions.includes(perm)}
                            onToggle={() =>
                              setHrFormPermissions((prev) =>
                                prev.includes(perm) ? prev.filter((p) => p !== perm) : [...new Set([...prev, perm])]
                              )
                            }
                          />
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="ds-label mb-2">Sidebar Modules</p>
                      <SidebarModulePicker value={hrFormModules} onChange={setHrFormModules} />
                    </div>

                    <Button type="button" onClick={handleCreateHr} disabled={hrActionLoading}>
                      {hrActionLoading ? "Saving..." : "Add HR"}
                    </Button>
                  </div>
                </Card>

                {!hrInsights || hrInsights.hrUsers.length === 0 ? (
                  <Empty text="No HR accounts yet. Create one above." />
                ) : (
                  <div className="company-dashboard-list-stack">
                    {hrInsights.hrUsers.map((hr) => {
                      const expanded = selectedHrId === hr.id;
                      return (
                        <div key={hr.id} className="company-dashboard-item-card">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="flex min-w-0 items-start gap-3">
                              <Avatar name={hr.name} size="md" />
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="ds-h3 truncate">{hr.name}</p>
                                  <Badge tone={hr.isActive ? "success" : "neutral"} dot>
                                    {hr.isActive ? "Active" : "Inactive"}
                                  </Badge>
                                </div>
                                <p className="ds-caption truncate">{hr.email}</p>
                                <p className="ds-caption mt-1">
                                  {hr.assignedInternships} internships · {hr.assignedCandidates} candidates · {hr.performanceMetrics.hiredCandidates} hires · {hr.performanceMetrics.conversionRate}% conversion
                                </p>
                                {hr.performanceMetrics.activitySummary && (
                                  <p className="ds-caption mt-0.5 opacity-80">{hr.performanceMetrics.activitySummary}</p>
                                )}
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <Button type="button" size="sm" variant="secondary" onClick={() => openHrInsights(hr)} disabled={hrActionLoading}>
                                <AppIcon icon={expanded ? ChevronUp : ChevronDown} size="xs" className="text-current" />
                                Insights
                              </Button>
                              <Button type="button" size="sm" variant="secondary" onClick={() => handleDeleteHr(hr.id, hr.email)} disabled={hrActionLoading}>
                                <AppIcon icon={Trash2} size="xs" className="text-current" />
                                Delete
                              </Button>
                            </div>
                          </div>

                          {expanded && (
                            <div className="mt-4 space-y-4 border-t border-[var(--ds-border)] pt-4">
                              <div>
                                <p className="ds-label mb-2">Performance</p>
                                <div className="grid gap-2 sm:grid-cols-3">
                                  <InfoTile label="Handled" value={hr.performanceMetrics.candidatesHandled} />
                                  <InfoTile label="Shortlisted" value={hr.performanceMetrics.shortlistedCandidates} />
                                  <InfoTile label="Interview Success" value={`${hr.performanceMetrics.interviewSuccessRate}%`} />
                                </div>
                              </div>

                              <div>
                                <p className="ds-label mb-2">Permissions</p>
                                <div className="flex flex-wrap gap-2">
                                  {HR_ASSIGNABLE_PERMISSIONS.map((perm) => (
                                    <PermissionChip
                                      key={`${hr.id}-${perm}`}
                                      label={perm}
                                      checked={permissionDraft.includes(perm)}
                                      onToggle={() =>
                                        setPermissionDraft((prev) =>
                                          prev.includes(perm) ? prev.filter((p) => p !== perm) : [...new Set([...prev, perm])]
                                        )
                                      }
                                    />
                                  ))}
                                </div>
                              </div>

                              <div>
                                <p className="ds-label mb-2">Sidebar Modules</p>
                                <SidebarModulePicker value={moduleDraft} onChange={setModuleDraft} />
                              </div>

                              <Button type="button" onClick={() => handleSaveHrPermissions(hr.id)} disabled={hrActionLoading}>
                                {hrActionLoading ? "Saving..." : "Save Permissions"}
                              </Button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      case "analytics-company": {
        const conversionTone = (rate: number): BadgeTone => (rate >= 50 ? "success" : rate >= 25 ? "accent" : "neutral");
        const hiringAnalytics = analytics?.hiringAnalytics;
        const departments = hiringAnalytics ? Object.entries(hiringAnalytics.departmentWiseHiring || {}).sort((a, b) => b[1] - a[1]) : [];
        const maxDeptCount = departments.reduce((max, [, count]) => Math.max(max, count), 0) || 1;
        return (
          <div className={companyDashboardStyles.pageStack}>
            <CompanyDashboardPageIntro title="Company Analytics" subtitle="Recruiter performance and hiring analytics." />
            {!analytics ? (
              <Empty text="Analytics not available." />
            ) : (
              <div className="space-y-4">
                {hiringAnalytics && (
                  <div className="stat-grid">
                    <InfoTile icon={Award} label="Total Hires" value={<span className="ds-stat-value">{hiringAnalytics.totalHires}</span>} />
                    <InfoTile icon={Users} label="Total Applications" value={<span className="ds-stat-value">{hiringAnalytics.totalApplications}</span>} />
                    <InfoTile icon={TrendingUp} label="Internship Performance" value={<span className="ds-stat-value">{hiringAnalytics.internshipPerformance}</span>} />
                  </div>
                )}

                <Card title="Recruiter Performance" titleIcon={BarChart3}>
                  {analytics.recruiterPerformance.length === 0 ? (
                    <p className="ds-caption">No recruiter activity yet.</p>
                  ) : (
                    <div className="company-dashboard-list-stack">
                      {analytics.recruiterPerformance.map((item) => {
                        const hrMatch = hrInsights?.hrUsers.find((hr) => hr.id === item.recruiterId);
                        const label = hrMatch ? hrMatch.name : `Recruiter ${item.recruiterId}`;
                        return (
                          <div key={item.recruiterId} className="company-dashboard-item-card !flex-row flex-wrap items-center justify-between gap-3">
                            <div className="flex min-w-0 items-center gap-3">
                              <Avatar name={label} size="sm" />
                              <div className="min-w-0">
                                <p className="ds-h3 truncate">{label}</p>
                                {hrMatch && <p className="ds-caption truncate">{hrMatch.email}</p>}
                              </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 text-right">
                              <span className="ds-caption">Handled {item.candidatesHandled} · Hired {item.hiredCandidates}</span>
                              <Badge tone={conversionTone(item.conversionRate)}>{item.conversionRate}% conversion</Badge>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </Card>

                {departments.length > 0 && (
                  <Card title="Hiring by Department" titleIcon={Layers}>
                    <div className="space-y-3">
                      {departments.map(([department, count]) => (
                        <div key={department}>
                          <div className="mb-1 flex items-center justify-between text-sm">
                            <span className="text-[var(--ds-text)]">{department}</span>
                            <span className="ds-caption">{count}</span>
                          </div>
                          <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--ds-surface-raised)]">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-primary-600 to-violet-600"
                              style={{ width: `${Math.max(4, Math.round((count / maxDeptCount) * 100))}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}
              </div>
            )}
          </div>
        );
      }
      case "analytics-salary": {
        const isExecutiveUser = ["owner", "ceo"].includes(currentUser?.companyAccountType || "");
        const stats = (values: number[]) => {
          const valid = values.filter((value) => typeof value === "number" && Number.isFinite(value));
          if (!valid.length) return null;
          const sorted = [...valid].sort((a, b) => a - b);
          const mid = Math.floor(sorted.length / 2);
          const median = sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
          const average = sorted.reduce((sum, value) => sum + value, 0) / sorted.length;
          return {
            min: sorted[0],
            max: sorted[sorted.length - 1],
            median: Math.round(median),
            average: Math.round(average),
            count: sorted.length
          };
        };
        const offeredStats = analytics?.salaryAnalytics ? stats(analytics.salaryAnalytics.offeredSalaryPerCandidate) : null;
        const stipendStats = analytics?.salaryAnalytics ? stats(analytics.salaryAnalytics.stipendAnalytics) : null;
        const centralTendencyLabel = isExecutiveUser ? "Average" : "Median";
        return (
          <div className={companyDashboardStyles.pageStack}>
            <CompanyDashboardPageIntro title="Salary Insights" subtitle="Company stipend and salary analytics." />
            {!canViewSalary ? (
              <Empty text="Salary insights are restricted to CEO / Company Admin." />
            ) : !analytics?.salaryAnalytics ? (
              <Empty text="Salary analytics not available." />
            ) : (
              <div className="space-y-4">
                <div className="stat-grid">
                  <InfoTile icon={DollarSign} label="Average Package" value={<span className="ds-stat-value">{analytics.salaryAnalytics.averagePackage}</span>} />
                  <InfoTile icon={TrendingUp} label="Total Salary Expenditure" value={<span className="ds-stat-value">{analytics.salaryAnalytics.totalSalaryExpenditure}</span>} />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Card title="Offered Salary Distribution" titleIcon={DollarSign}>
                    {!offeredStats ? (
                      <p className="ds-caption">No offer data yet.</p>
                    ) : (
                      <div className="grid grid-cols-3 gap-2">
                        <InfoTile label="Min" value={offeredStats.min} />
                        <InfoTile
                          label={centralTendencyLabel}
                          value={isExecutiveUser ? offeredStats.average : offeredStats.median}
                        />
                        <InfoTile label="Max" value={offeredStats.max} />
                      </div>
                    )}
                  </Card>
                  <Card title="Stipend Distribution" titleIcon={DollarSign}>
                    {!stipendStats ? (
                      <p className="ds-caption">No stipend data yet.</p>
                    ) : (
                      <div className="grid grid-cols-3 gap-2">
                        <InfoTile label="Min" value={stipendStats.min} />
                        <InfoTile
                          label={centralTendencyLabel}
                          value={isExecutiveUser ? stipendStats.average : stipendStats.median}
                        />
                        <InfoTile label="Max" value={stipendStats.max} />
                      </div>
                    )}
                  </Card>
                </div>
              </div>
            )}
          </div>
        );
      }
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
          onScheduleInterview={setApplicantScheduleTarget}
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
      <InterviewScheduleModal
        open={Boolean(applicantScheduleTarget)}
        candidateName={applicantScheduleTarget?.candidateName}
        mode={applicantScheduleTarget?.roundId ? "reschedule" : "schedule"}
        initialSlot={applicantScheduleTarget?.initialSlot}
        saving={saving}
        onClose={() => setApplicantScheduleTarget(null)}
        onConfirm={async (slot) => {
          if (!applicantScheduleTarget) return;
          await handleScheduleInterview(applicantScheduleTarget.applicationId, slot, applicantScheduleTarget.roundId);
          setApplicantScheduleTarget(null);
        }}
      />
      <ViewResumeModal
        open={Boolean(resumeModalApplicationId)}
        applicationId={resumeModalApplicationId}
        candidateName={resumeModalApp?.intern?.fullName}
        role={resumeModalApp?.internship?.role}
        onClose={() => setResumeModalApplicationId(null)}
      />
    </div>
  );
}
