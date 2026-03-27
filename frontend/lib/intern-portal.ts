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
  completedCourses: string[];
  resume: {
    filePath: string;
    text: string;
    score: number;
    scoreSource?: string;
    predictedCategory?: string;
    confidence?: number | null;
    analysis?: ResumeAnalysis | null;
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

export type Recommendation = {
  internship: {
    _id: string;
    role: string;
    company?: { companyName?: string };
    location?: string;
  };
  recommendationScore: number;
  skillGap: { matched: string[]; missing: string[]; matchPercent: number };
};

export async function fetchInternProfile() {
  const response = await apiRequest<{ profile: InternProfile }>("/api/intern/profile");
  return response.profile;
}

export async function fetchInternProfileWithScore() {
  const profile = await fetchInternProfile();
  if (!profile.resumeUploaded) return profile;

  try {
    const scoreResp = await apiRequest<{
      score: number;
      scoreSource?: string;
      predictedCategory?: string;
      confidence?: number | null;
      analysis?: ResumeAnalysis;
    }>("/api/intern/resume/score");

    return {
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
  } catch {
    return profile;
  }
}

export async function fetchInternApplications() {
  const response = await apiRequest<{ applications: Application[] }>("/api/intern/applications");
  return response.applications || [];
}

export async function fetchInternRecommendations() {
  const response = await apiRequest<{ recommendations: Recommendation[] }>("/api/intern/recommendations");
  return response.recommendations || [];
}

