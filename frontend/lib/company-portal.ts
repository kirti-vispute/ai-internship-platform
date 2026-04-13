import { apiRequest } from "@/lib/api-client";
import { getAuthSession } from "@/lib/session";

export type CompanyProfile = {
  _id: string;
  companyName: string;
  companyEmail: string;
  gst: string;
  contactName: string;
  phone: string;
  website?: string;
  address?: string;
  description?: string;
  verificationStatus: "pending" | "verified" | "rejected";
  createdAt?: string;
  updatedAt?: string;
};

export type CompanyInternship = {
  _id: string;
  role: string;
  skillsRequired: string[];
  prioritySkills: string[];
  stipend?: string;
  duration?: string;
  location?: string;
  mode?: "remote" | "on-site" | "hybrid" | "";
  responsibilities?: string;
  description: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type CompanyApplication = {
  _id: string;
  status: string;
  matchScore: number;
  relevanceScore?: number;
  attachedResumePath?: string;
  availabilityStatus?: "yes" | "no";
  joiningDate?: string;
  intern?: {
    _id?: string;
    fullName?: string;
    email?: string;
    mobile?: string;
    skills?: string[];
    education?: string[];
    resume?: { score?: number };
  };
  internship: {
    _id?: string;
    role?: string;
    location?: string;
  };
  stageHistory: Array<{ stage: string; note: string; changedAt?: string }>;
  hrFeedback: Array<{ feedback: string; createdAt?: string }>;
  interviewRounds?: Array<{
    _id?: string;
    roundType?: string;
    interviewDate?: string;
    interviewTime?: string;
    mode?: "online" | "offline" | "";
    meetingLink?: string;
    location?: string;
    notes?: string;
    status?: "scheduled" | "completed" | "cleared" | "rejected";
    updatedAt?: string;
  }>;
  createdAt?: string;
  updatedAt?: string;
};

export type CandidateSearchResult = {
  _id: string;
  fullName: string;
  email: string;
  mobile?: string;
  skills: string[];
  resumeScore: number;
};
export type CompanyMatchedCandidate = {
  internshipId: string;
  internshipRole: string;
  internshipLocation?: string;
  score: number;
  skillGap?: {
    matched?: string[];
    missing?: string[];
    matchPercent?: number;
  };
  internProfile?: {
    _id?: string;
    fullName?: string;
    email?: string;
    mobile?: string;
    skills?: string[];
    resume?: { score?: number };
  };
};

type CacheEntry = { ts: number; data: unknown };
const CACHE_TTL_MS = 45 * 1000;
const cacheStore = new Map<string, CacheEntry>();
const inFlightStore = new Map<string, Promise<unknown>>();
const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000").replace(/\/+$/, "");

function getCache<T>(key: string): T | null {
  const cached = cacheStore.get(key);
  if (!cached) return null;
  if (Date.now() - cached.ts > CACHE_TTL_MS) {
    cacheStore.delete(key);
    return null;
  }
  return cached.data as T;
}

function setCache<T>(key: string, data: T) {
  cacheStore.set(key, { ts: Date.now(), data });
}

async function withCache<T>(key: string, force: boolean, fetcher: () => Promise<T>): Promise<T> {
  if (!force) {
    const cached = getCache<T>(key);
    if (cached) return cached;

    const active = inFlightStore.get(key);
    if (active) return active as Promise<T>;
  }

  const pending = fetcher()
    .then((result) => {
      setCache(key, result);
      return result;
    })
    .finally(() => {
      inFlightStore.delete(key);
    });

  inFlightStore.set(key, pending);
  return pending;
}

export function invalidateCompanyPortalCache() {
  cacheStore.clear();
  inFlightStore.clear();
}

export async function fetchCompanyProfile(force = false) {
  return withCache("company:profile", force, async () => {
    const response = await apiRequest<{ profile: CompanyProfile }>("/api/company/profile");
    return response.profile;
  });
}

export async function updateCompanyProfile(payload: Partial<CompanyProfile>) {
  const response = await apiRequest<{ profile: CompanyProfile; message: string }>("/api/company/profile", {
    method: "PUT",
    body: JSON.stringify(payload)
  });
  setCache("company:profile", response.profile);
  return response.profile;
}

export async function fetchCompanyInternships(force = false) {
  return withCache("company:internships", force, async () => {
    const response = await apiRequest<{ internships: CompanyInternship[] }>("/api/company/internships");
    return response.internships || [];
  });
}

export async function postCompanyInternship(payload: {
  role: string;
  skillsRequired?: string[];
  prioritySkills?: string[];
  stipend?: string;
  duration?: string;
  location?: string;
  mode?: string;
  responsibilities?: string;
  description: string;
}) {
  const response = await apiRequest<{ internship: CompanyInternship; message: string }>("/api/company/internships", {
    method: "POST",
    body: JSON.stringify(payload)
  });
  cacheStore.delete("company:internships");
  return response.internship;
}

export async function fetchApplicantsForInternship(internshipId: string, force = false) {
  return withCache(`company:applicants:${internshipId}`, force, async () => {
    const response = await apiRequest<{ applications: CompanyApplication[] }>(`/api/company/internships/${internshipId}/applicants`);
    return response.applications || [];
  });
}

export async function fetchCompanyApplications(force = false) {
  return withCache("company:applications", force, async () => {
    const internships = await fetchCompanyInternships(force);
    if (!internships.length) return [] as CompanyApplication[];

    const grouped = await Promise.all(
      internships.map(async (internship) => {
        const applications = await fetchApplicantsForInternship(internship._id, force);
        return applications.map((application) => ({
          ...application,
          internship: {
            _id: internship._id,
            role: internship.role,
            location: internship.location || ""
          }
        }));
      })
    );

    return grouped.flat().sort((a, b) => {
      const aTime = new Date(a.createdAt || 0).getTime();
      const bTime = new Date(b.createdAt || 0).getTime();
      return bTime - aTime;
    });
  });
}

export async function updateCompanyApplicationStage(applicationId: string, status: string, note = "") {
  const response = await apiRequest<{ application: CompanyApplication }>(`/api/company/applications/${applicationId}/stage`, {
    method: "PATCH",
    body: JSON.stringify({ status, note })
  });
  cacheStore.delete("company:applications");
  return response.application;
}

export async function scheduleInterviewRound(
  applicationId: string,
  payload: { roundType: string; interviewDate: string; interviewTime: string; mode?: "online" | "offline" | ""; meetingLink?: string; location?: string; notes?: string }
) {
  const response = await apiRequest<{ application: CompanyApplication }>(`/api/company/applications/${applicationId}/interviews`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
  cacheStore.delete("company:applications");
  return response.application;
}

export async function updateInterviewRound(
  applicationId: string,
  roundId: string,
  payload: { status?: "scheduled" | "completed" | "cleared" | "rejected"; notes?: string }
) {
  const response = await apiRequest<{ application: CompanyApplication }>(`/api/company/applications/${applicationId}/interviews/${roundId}`, {
    method: "PATCH",
    body: JSON.stringify(payload)
  });
  cacheStore.delete("company:applications");
  return response.application;
}

export async function openCompanyApplicationResume(applicationId: string) {
  const session = getAuthSession();
  const token = session.token;
  if (!token) {
    throw new Error("Session not found");
  }

  const response = await fetch(`${API_BASE_URL}/api/applications/${applicationId}/resume`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error((data as { message?: string }).message || "Resume not available");
  }

  const blob = await response.blob();
  const objectUrl = window.URL.createObjectURL(blob);
  const opened = window.open(objectUrl, "_blank", "noopener,noreferrer");
  if (!opened) {
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = "resume";
    document.body.appendChild(link);
    link.click();
    link.remove();
  }
  window.setTimeout(() => window.URL.revokeObjectURL(objectUrl), 120000);
}

export async function fetchMatchedCandidatesForInternship(internship: CompanyInternship, force = false) {
  return withCache(`company:matched:${internship._id}`, force, async () => {
    const response = await apiRequest<{
      matchedCandidates: Array<{
        internProfile?: CompanyMatchedCandidate["internProfile"];
        score: number;
        skillGap?: CompanyMatchedCandidate["skillGap"];
      }>;
    }>(`/api/company/internships/${internship._id}/matched-candidates`);

    return (response.matchedCandidates || []).map((candidate) => ({
      internshipId: internship._id,
      internshipRole: internship.role,
      internshipLocation: internship.location,
      score: candidate.score,
      skillGap: candidate.skillGap,
      internProfile: candidate.internProfile
    })) as CompanyMatchedCandidate[];
  });
}

export async function fetchCompanyMatchedCandidates(force = false) {
  return withCache("company:matched-all", force, async () => {
    const internships = await fetchCompanyInternships(force);
    if (!internships.length) return [] as CompanyMatchedCandidate[];

    const all = await Promise.all(internships.map((internship) => fetchMatchedCandidatesForInternship(internship, force)));
    return all.flat().sort((a, b) => b.score - a.score);
  });
}

export async function searchCandidates(query: string) {
  const q = query.trim();
  if (!q) return [] as CandidateSearchResult[];

  const response = await apiRequest<{ candidates: CandidateSearchResult[] }>(`/api/candidates/search?q=${encodeURIComponent(q)}`);
  return response.candidates || [];
}
