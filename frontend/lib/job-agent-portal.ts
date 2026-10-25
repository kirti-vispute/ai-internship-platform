import { apiRequest } from "@/lib/api-client";

export type JobAgentWorkMode = "remote" | "on-site" | "hybrid" | "any";
export type JobAgentExperienceLevel = "intern" | "fresher" | "0-1 years" | "1-3 years" | "3+ years";
export type JobAgentNotificationFrequency = "realtime" | "daily" | "weekly";
export type JobAgentApplicationStatus = "saved" | "interested" | "applied" | "interview" | "rejected";

export type JobAgentPreference = {
  _id: string;
  user: string;
  internProfile: string;
  enabled: boolean;
  desiredRoles: string[];
  locations: string[];
  workMode: JobAgentWorkMode;
  minSalary: number | null;
  salaryCurrency: string;
  experienceLevel: JobAgentExperienceLevel;
  notificationFrequency: JobAgentNotificationFrequency;
  lastSweepAt: string | null;
  lastSweepMatchCount: number;
  pausedAt: string | null;
  pausedReason: string;
};

export type JobAgentStatus = {
  configured: boolean;
  enabled: boolean;
  pausedAt: string | null;
  lastSweepAt: string | null;
  lastSweepMatchCount: number;
  profileCompleteness: { percent: number; missing: string[] };
  trackedApplicationCount: number;
};

export type JobAgentSource =
  | "internal"
  | "remotive"
  | "adzuna"
  | "arbeitnow"
  | "themuse"
  | "remoteok"
  | "greenhouse"
  | "lever"
  | "jooble"
  | "naukri"
  | "linkedin"
  | "indeed"
  | "wellfound";

export const JOB_AGENT_SOURCE_LABELS: Record<JobAgentSource, string> = {
  internal: "CareerSetu",
  remotive: "Remotive",
  adzuna: "Adzuna",
  arbeitnow: "Arbeitnow",
  themuse: "The Muse",
  remoteok: "Remote OK",
  greenhouse: "Greenhouse",
  lever: "Lever",
  jooble: "Jooble",
  naukri: "Naukri",
  linkedin: "LinkedIn",
  indeed: "Indeed",
  wellfound: "Wellfound"
};

export type JobAgentExperienceLevelTag = "internship" | "fresher_entry" | "mid_senior" | "unspecified_full_time" | "unspecified";

export const JOB_AGENT_CATEGORY_LABELS: Record<JobAgentExperienceLevelTag, string> = {
  internship: "Internship",
  fresher_entry: "Fresher / Entry-level",
  mid_senior: "Mid / Senior",
  unspecified_full_time: "Full-time",
  unspecified: "Unspecified"
};

export type JobProviderHealth = {
  source: string;
  status: "ok" | "failed" | "partial" | "skipped" | "needs_credentials" | "no_legitimate_api";
  reason: string;
  jobsFetched: number;
  lastRunAt: string | null;
  lastSuccessAt: string | null;
};

export type UnifiedJob = {
  id: string;
  source: JobAgentSource;
  sourceId: string;
  isInternal: boolean;
  title: string;
  companyName: string;
  location: string;
  workMode: string;
  jobType: string;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string;
  stipendText: string;
  category: string;
  description: string;
  applyUrl: string;
  postedAt: string | null;
  skillsRequired: string[];
  prioritySkills: string[];
  rawEligibilityText: string;
  requiresAttribution?: boolean;
  fitScore: number;
  matchedRequiredSkills: string[];
  missingRequiredSkills: string[];
  matchedPreferredSkills: string[];
  missingPreferredSkills: string[];
  preferenceMatch: Record<string, boolean | null>;
  eligibilityConcerns: string[];
  explanation: string;
  experienceLevelTag: JobAgentExperienceLevelTag;
  roleRelevance?: { tag: "relevant" | "adjacent" | "unrelated" | "unknown" | "no_preference" | "not_applicable"; score: number };
};

export type JobAgentApplication = {
  _id: string;
  user: string;
  internProfile: string;
  jobSource: string;
  jobRef: string;
  internshipId: string | null;
  externalJobId: string | null;
  snapshot: {
    title: string;
    companyName: string;
    location: string;
    applyUrl: string;
    skillsRequired?: string[];
    prioritySkills?: string[];
  };
  fitScore: number | null;
  status: JobAgentApplicationStatus;
  statusHistory: { status: JobAgentApplicationStatus; note?: string; changedAt: string }[];
  tailoredResume: { content: string; generatedAt: string | null; source: string };
  coverLetter: { content: string; generatedAt: string | null; source: string };
  notes: string;
  createdAt: string;
  updatedAt: string;
};

export async function fetchJobAgentStatus() {
  const response = await apiRequest<JobAgentStatus>("/api/job-agent/status");
  return response;
}

export async function fetchJobAgentPreferences() {
  const response = await apiRequest<{ preference: JobAgentPreference | null; configured: boolean }>(
    "/api/job-agent/preferences"
  );
  return response;
}

export async function saveJobAgentPreferences(payload: Partial<JobAgentPreference> & { enabled?: boolean }) {
  const response = await apiRequest<{ preference: JobAgentPreference }>("/api/job-agent/preferences", {
    method: "PUT",
    body: JSON.stringify(payload)
  });
  return response.preference;
}

export async function pauseJobAgent(reason?: string) {
  const response = await apiRequest<{ preference: JobAgentPreference }>("/api/job-agent/pause", {
    method: "POST",
    body: JSON.stringify({ reason: reason || "" })
  });
  return response.preference;
}

export async function resumeJobAgent() {
  const response = await apiRequest<{ preference: JobAgentPreference }>("/api/job-agent/resume", {
    method: "POST"
  });
  return response.preference;
}

export type JobAgentFeedFilters = {
  role?: string;
  workMode?: string;
  location?: string;
  source?: string;
  category?: string;
  skills?: string[];
  minSalary?: number;
  entryLevelOnly?: boolean;
  page?: number;
  limit?: number;
};

export async function fetchJobAgentFeed(filters: JobAgentFeedFilters = {}) {
  const params = new URLSearchParams();
  if (filters.role) params.set("role", filters.role);
  if (filters.workMode) params.set("workMode", filters.workMode);
  if (filters.location) params.set("location", filters.location);
  if (filters.source) params.set("source", filters.source);
  if (filters.category) params.set("category", filters.category);
  if (filters.skills?.length) params.set("skills", filters.skills.join(","));
  if (filters.minSalary) params.set("minSalary", String(filters.minSalary));
  if (filters.entryLevelOnly) params.set("entryLevelOnly", "true");
  if (filters.page) params.set("page", String(filters.page));
  if (filters.limit) params.set("limit", String(filters.limit));

  const query = params.toString();
  const response = await apiRequest<{ jobs: UnifiedJob[]; meta?: { pagination?: Record<string, number> } }>(
    `/api/job-agent/feed${query ? `?${query}` : ""}`
  );
  return response;
}

export async function fetchJobAgentProviderHealth() {
  const response = await apiRequest<{ providers: JobProviderHealth[] }>("/api/job-agent/providers");
  return response.providers;
}

export async function fetchJobAgentApplications(status?: JobAgentApplicationStatus) {
  const query = status ? `?status=${status}&limit=100` : "?limit=100";
  const response = await apiRequest<{ applications: JobAgentApplication[] }>(`/api/job-agent/applications${query}`);
  return response.applications;
}

export async function trackJobAgentJob(job: UnifiedJob, status: JobAgentApplicationStatus = "saved") {
  const response = await apiRequest<{ application: JobAgentApplication }>("/api/job-agent/applications", {
    method: "POST",
    body: JSON.stringify({
      jobSource: job.source,
      jobRef: job.sourceId,
      internshipId: job.isInternal ? job.id : null,
      externalJobId: job.isInternal ? null : job.id,
      snapshot: {
        title: job.title,
        companyName: job.companyName,
        location: job.location,
        applyUrl: job.applyUrl,
        skillsRequired: job.skillsRequired,
        prioritySkills: job.prioritySkills
      },
      fitScore: job.fitScore,
      status
    })
  });
  return response.application;
}

export async function updateJobAgentApplication(
  id: string,
  payload: { status?: JobAgentApplicationStatus; notes?: string }
) {
  const response = await apiRequest<{ application: JobAgentApplication }>(`/api/job-agent/applications/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload)
  });
  return response.application;
}

export async function deleteJobAgentApplication(id: string) {
  return apiRequest<{ message: string }>(`/api/job-agent/applications/${id}`, { method: "DELETE" });
}

export async function generateJobAgentMaterials(id: string) {
  const response = await apiRequest<{ application: JobAgentApplication }>(
    `/api/job-agent/applications/${id}/materials`,
    { method: "POST" }
  );
  return response.application;
}

export async function updateJobAgentMaterials(
  id: string,
  payload: { tailoredResumeContent?: string; coverLetterContent?: string }
) {
  const response = await apiRequest<{ application: JobAgentApplication }>(
    `/api/job-agent/applications/${id}/materials`,
    { method: "PATCH", body: JSON.stringify(payload) }
  );
  return response.application;
}

export function isSafeExternalUrl(url?: string | null): boolean {
  if (!url || typeof url !== "string") return false;
  const trimmed = url.trim();
  if (!trimmed) return false;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

