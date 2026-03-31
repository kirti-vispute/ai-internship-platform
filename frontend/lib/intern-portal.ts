import { apiRequest } from "@/lib/api-client";

export type ResumeSection = { key: string; label: string; score: number };

export type ResumeAnalysis = {
  overallScore: number;
  categoryScores: {
    ats: number;
    content: number;
    impact: number;
    skills: number;
    structure: number;
  };
  sectionBreakdown?: ResumeSection[];
  strengths: string[];
  improvements: string[];
  criticalIssues?: string[];
  warnings?: string[];
  checks?: {
    wordCount?: number;
    matchedSkills?: string[];
    missingSkills?: string[];
  };
};

export type InternProfile = {
  _id: string;
  fullName: string;
  email: string;
  mobile: string;
  skills: string[];
  education: string[];
  projects: string[];
  certifications: string[];
  experience?: string[];
  achievements?: string[];
  links?: string[];
  summary?: string;
  completedCourses: string[];
  resume: {
    filePath: string;
    text: string;
    score: number;
    scoreSource?: string;
    predictedCategory?: string;
    confidence?: number | null;
    analysis?: ResumeAnalysis | null;
    parsed?: {
      fullName?: string;
      email?: string;
      mobile?: string;
      location?: string;
      summary?: string;
      skills?: string[];
      projects?: Array<{ title?: string; techStack?: string[]; description?: string; demoLink?: string }>;
      education?: Array<{ degree?: string; institution?: string; startYear?: string; endYear?: string; grade?: string; raw?: string }>;
      certifications?: Array<{ name?: string; issuer?: string; year?: string; raw?: string }>;
      experience?: Array<{ role?: string; company?: string; duration?: string; description?: string }>;
      achievements?: string[];
      languages?: string[];
      links?: string[];
    } | null;
  };
  resumeUploaded: boolean;
};

export type Application = {
  _id: string;
  status: string;
  matchScore: number;
  internship: {
    _id?: string;
    role: string;
    company?: { companyName?: string };
    location?: string;
  };
  stageHistory: Array<{ stage: string; note: string; changedAt: string }>;
  hrFeedback: Array<{ feedback: string; createdAt: string }>;
};

export type InternshipListing = {
  _id: string;
  role: string;
  skillsRequired?: string[];
  prioritySkills?: string[];
  location?: string;
  stipend?: string;
  duration?: string;
  description?: string;
  company?: { companyName?: string };
};
export type Recommendation = {
  internship: {
    _id: string;
    role: string;
    company?: { companyName?: string };
    location?: string;
  };
  skillMatchPercent: number;
  recommendationScore?: number;
  skillGap: { matched: string[]; missing: string[]; matchPercent: number };
};

const CACHE_TTL_MS = 60 * 1000;
const cacheStore = new Map<string, { ts: number; data: unknown }>();

function getCache<T>(key: string): T | null {
  const entry = cacheStore.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL_MS) {
    cacheStore.delete(key);
    return null;
  }
  return entry.data as T;
}

function setCache<T>(key: string, data: T) {
  cacheStore.set(key, { ts: Date.now(), data });
}

export function invalidateInternCache() {
  cacheStore.clear();
}

export async function fetchInternProfile(force = false) {
  if (!force) {
    const cached = getCache<InternProfile>("intern:profile");
    if (cached) return cached;
  }
  const response = await apiRequest<{ profile: InternProfile }>("/api/intern/profile");
  setCache("intern:profile", response.profile);
  return response.profile;
}

export async function fetchInternProfileWithScore(force = false) {
  const profile = await fetchInternProfile(force);
  if (!profile.resumeUploaded) return profile;

  try {
    const scoreResp = await apiRequest<{
      score: number;
      scoreSource?: string;
      predictedCategory?: string;
      confidence?: number | null;
      analysis?: ResumeAnalysis;
    }>("/api/intern/resume/score");

    const hydrated = {
      ...profile,
      resume: {
        ...profile.resume,
        score: scoreResp.score ?? profile.resume.score,
        scoreSource: scoreResp.scoreSource || profile.resume.scoreSource,
        predictedCategory: scoreResp.predictedCategory || profile.resume.predictedCategory,
        confidence: typeof scoreResp.confidence === "number" ? scoreResp.confidence : profile.resume.confidence,
        analysis: scoreResp.analysis || profile.resume.analysis
      }
    };
    setCache("intern:profile", hydrated);
    return hydrated;
  } catch {
    return profile;
  }
}

export async function fetchInternApplications(force = false) {
  if (!force) {
    const cached = getCache<Application[]>("intern:applications");
    if (cached) return cached;
  }
  const response = await apiRequest<{ applications: Application[] }>("/api/intern/applications");
  const applications = response.applications || [];
  setCache("intern:applications", applications);
  return applications;
}

export async function fetchActiveInternships(force = false) {
  if (!force) {
    const cached = getCache<InternshipListing[]>("intern:internships");
    if (cached) return cached;
  }

  const response = await apiRequest<{ internships: InternshipListing[] }>("/api/intern/internships");
  const internships = response.internships || [];
  setCache("intern:internships", internships);
  return internships;
}
export async function fetchInternRecommendations(force = false) {
  if (!force) {
    const cached = getCache<Recommendation[]>("intern:recommendations");
    if (cached) return cached;
  }
  const response = await apiRequest<{ recommendations: Recommendation[] }>("/api/intern/recommendations");
  const recommendations = (response.recommendations || []).map((item) => ({
    ...item,
    skillMatchPercent: Number.isFinite(item?.skillMatchPercent)
      ? item.skillMatchPercent
      : Number(item?.recommendationScore || item?.skillGap?.matchPercent || 0)
  }));
  setCache("intern:recommendations", recommendations);
  return recommendations;
}

