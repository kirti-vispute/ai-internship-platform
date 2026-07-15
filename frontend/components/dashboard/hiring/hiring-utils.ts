import type { CompanyApplication, CompanyInternship, CompanyMatchedCandidate } from "@/lib/company-portal";

export const EXTENDED_PIPELINE_STAGES = [
  { key: "applied", label: "Applied" },
  { key: "shortlisted", label: "Shortlisted" },
  { key: "interview_scheduled", label: "Interview Scheduled" },
  { key: "interviewed", label: "Interviewed" },
  { key: "selected", label: "Selected" }
] as const;

export type ExtendedPipelineStageKey = (typeof EXTENDED_PIPELINE_STAGES)[number]["key"];

export function normalizeToExtendedStage(status: string): ExtendedPipelineStageKey {
  const normalized = normalizeRawStatus(status);
  if (normalized === "shortlisted") return "shortlisted";
  if (["interview_scheduled", "technical_round", "hr_round", "interview"].includes(normalized)) {
    return "interview_scheduled";
  }
  if (normalized === "interview_completed") return "interviewed";
  if (normalized === "selected" || normalized === "offered") return "selected";
  if (normalized === "rejected") return "applied";
  return "applied";
}

export function computeExtendedStageCounts(applications: CompanyApplication[]) {
  const counts: Record<ExtendedPipelineStageKey, number> = {
    applied: 0,
    shortlisted: 0,
    interview_scheduled: 0,
    interviewed: 0,
    selected: 0
  };
  applications.forEach((application) => {
    const normalized = normalizeRawStatus(application.status);
    if (normalized === "rejected" || normalized === "withdrawn") return;
    counts[normalizeToExtendedStage(application.status)] += 1;
  });
  return counts;
}

export function countOffersSent(applications: CompanyApplication[]) {
  return applications.filter((application) =>
    ["selected", "offered"].includes(normalizeRawStatus(application.status))
  ).length;
}

export const HIRING_FLOW_STAGES = [
  { key: "applied", label: "Applied" },
  { key: "shortlisted", label: "Shortlisted" },
  { key: "interview", label: "Interview" },
  { key: "selected", label: "Selected" },
  { key: "rejected", label: "Rejected" }
] as const;

export type HiringFlowStageKey = (typeof HIRING_FLOW_STAGES)[number]["key"];

export function normalizeRawStatus(status: string) {
  const value = String(status || "").toLowerCase();
  if (value === "screening" || value === "reviewed") return "under_review";
  if (value === "offered") return "selected";
  if (value === "interview") return "interview_scheduled";
  return value;
}

export function normalizeToFlowStage(status: string): HiringFlowStageKey {
  const normalized = normalizeRawStatus(status);
  if (normalized === "shortlisted") return "shortlisted";
  if (["interview_scheduled", "technical_round", "hr_round", "under_review"].includes(normalized)) {
    return "interview";
  }
  if (normalized === "selected") return "selected";
  if (normalized === "rejected") return "rejected";
  return "applied";
}

export function computeFlowStageCounts(applications: CompanyApplication[]) {
  const counts: Record<HiringFlowStageKey, number> = {
    applied: 0,
    shortlisted: 0,
    interview: 0,
    selected: 0,
    rejected: 0
  };
  applications.forEach((application) => {
    const stage = normalizeToFlowStage(application.status);
    counts[stage] += 1;
  });
  return counts;
}

export function countApplicationsForJob(applications: CompanyApplication[], internshipId: string) {
  return applications.filter((application) => application.internship?._id === internshipId).length;
}

export function getActiveInternships(internships: CompanyInternship[]) {
  return internships.filter((internship) => internship.isActive);
}

export function getShortlistedCandidates(applications: CompanyApplication[], limit = 8) {
  return applications
    .filter((application) => normalizeToFlowStage(application.status) === "shortlisted")
    .sort((a, b) => (b.relevanceScore ?? b.matchScore ?? 0) - (a.relevanceScore ?? a.matchScore ?? 0))
    .slice(0, limit);
}

export const OVERVIEW_PIPELINE_STAGES = [
  { key: "applied", label: "Applied" },
  { key: "shortlisted", label: "Shortlisted" },
  { key: "interview", label: "Interview" },
  { key: "selected", label: "Selected" }
] as const;

export function findApplicationForMatch(match: CompanyMatchedCandidate, applications: CompanyApplication[]) {
  const internId = match.internProfile?._id;
  if (!internId) return null;
  return (
    applications.find(
      (application) => application.intern?._id === internId && application.internship?._id === match.internshipId
    ) ?? null
  );
}

export function countInterviewStageCandidates(applications: CompanyApplication[]) {
  return computeFlowStageCounts(applications).interview;
}

export function getMatchScore(application: CompanyApplication) {
  return application.relevanceScore ?? application.matchScore ?? null;
}

export function getSkillPreview(application: CompanyApplication, max = 5) {
  const skills = application.intern?.skills || [];
  return skills.slice(0, max);
}

export function getInterviewStageCandidates(applications: CompanyApplication[]) {
  return applications.filter((application) => normalizeToFlowStage(application.status) === "interview");
}
