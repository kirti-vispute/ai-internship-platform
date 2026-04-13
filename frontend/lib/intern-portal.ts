import { apiRequest } from "@/lib/api-client";
import { computeSkillMatch, normalizeSkillList } from "@/lib/skill-normalizer";

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
  relevanceScore?: number;
  appliedAt?: string;
  attachedResumePath?: string;
  availabilityStatus?: "yes" | "no";
  joiningDate?: string;
  internId?: string;
  internshipId?: string;
  companyId?: string;
  internship: {
    _id?: string;
    role: string;
    company?: { companyName?: string };
    location?: string;
    skillsRequired?: string[];
    prioritySkills?: string[];
  };
  stageHistory: Array<{ stage: string; note: string; changedAt: string }>;
  hrFeedback: Array<{ feedback: string; createdAt: string }>;
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
  mode?: "remote" | "on-site" | "hybrid" | "";
  responsibilities?: string;
  company?: {
    _id?: string;
    companyName?: string;
    description?: string;
    website?: string;
    address?: string;
  };
};

export type Recommendation = {
  internship: {
    _id: string;
    role: string;
    description?: string;
    stipend?: string;
    duration?: string;
    mode?: "remote" | "on-site" | "hybrid" | "";
    responsibilities?: string;
    company?: {
      _id?: string;
      companyName?: string;
      description?: string;
      website?: string;
      address?: string;
    };
    location?: string;
    skillsRequired?: string[];
    prioritySkills?: string[];
  };
  requiredSkillMatchPercent: number;
  preferredSkillMatchPercent: number | null;
  overallRecommendationScore: number;
  recommendationScore?: number;
  skillMatchPercent?: number;
  matchedRequiredSkills: string[];
  missingRequiredSkills: string[];
  matchedPreferredSkills: string[];
  missingPreferredSkills: string[];
  skillGap: { matched: string[]; missing: string[]; matchPercent: number };
};

const CACHE_TTL_MS = 60 * 1000;
const cacheStore = new Map<string, { ts: number; data: unknown }>();
const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000").replace(/\/+$/, "");

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

export function buildAssetUrl(relativePath: string) {
  let normalized = String(relativePath || "").trim().replace(/\\/g, "/").replace(/^\/+/, "");
  const uploadsIdx = normalized.indexOf("/uploads/");
  if (uploadsIdx >= 0) normalized = normalized.slice(uploadsIdx + 1);
  if (normalized.includes("uploads/")) normalized = normalized.slice(normalized.indexOf("uploads/"));
  if (!normalized) return "";
  if (/^https?:\/\//i.test(normalized)) return normalized;
  return `${API_BASE_URL}/${normalized}`;
}

export async function applyToInternship(
  internshipId: string,
  payload: { availabilityStatus: "yes" | "no"; joiningDate?: string | null }
) {
  const response = await apiRequest<{
    message: string;
    application: Application;
    relevance?: {
      relevanceScore?: number;
      requiredSkillMatchPercent?: number;
      preferredSkillMatchPercent?: number | null;
      missingRequiredSkills?: string[];
    };
  }>(`/api/intern/apply/${internshipId}`, {
    method: "POST",
    body: JSON.stringify(payload)
  });

  cacheStore.delete("intern:applications");
  return response;
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

export async function fetchInternRecommendations(internSkills: unknown, force = false) {
  const normalizedInternSkills = normalizeSkillList(internSkills);
  if (normalizedInternSkills.length === 0) {
    return [];
  }

  const cacheKey = `intern:recommendations:${normalizedInternSkills.join("|")}`;
  if (!force) {
    const cached = getCache<Recommendation[]>(cacheKey);
    if (cached) return cached;
  }

  const internships = await fetchActiveInternships(force);

  const recommendations: Recommendation[] = internships
    .map((internship) => {
      const match = computeSkillMatch(
        normalizedInternSkills,
        internship.skillsRequired || [],
        internship.prioritySkills || []
      );

      return {
        internship: {
          _id: internship._id,
          role: internship.role,
          description: internship.description,
          stipend: internship.stipend,
          duration: internship.duration,
          mode: internship.mode,
          responsibilities: internship.responsibilities,
          company: internship.company,
          location: internship.location,
          skillsRequired: internship.skillsRequired || [],
          prioritySkills: internship.prioritySkills || []
        },
        requiredSkillMatchPercent: match.requiredMatchPercent,
        preferredSkillMatchPercent: match.preferredMatchPercent,
        overallRecommendationScore: match.overallScore,
        recommendationScore: match.overallScore,
        skillMatchPercent: match.requiredMatchPercent,
        matchedRequiredSkills: match.matchedRequiredSkills,
        missingRequiredSkills: match.missingRequiredSkills,
        matchedPreferredSkills: match.matchedPreferredSkills,
        missingPreferredSkills: match.missingPreferredSkills,
        skillGap: {
          matched: match.matchedRequiredSkills,
          missing: match.missingRequiredSkills,
          matchPercent: match.requiredMatchPercent
        }
      };
    })
    .sort((a, b) => {
      if (b.overallRecommendationScore !== a.overallRecommendationScore) {
        return b.overallRecommendationScore - a.overallRecommendationScore;
      }
      if (b.requiredSkillMatchPercent !== a.requiredSkillMatchPercent) {
        return b.requiredSkillMatchPercent - a.requiredSkillMatchPercent;
      }
      return String(a.internship.role || "").localeCompare(String(b.internship.role || ""));
    });

  setCache(cacheKey, recommendations);
  return recommendations;
}

