"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RoleDashboardGuard } from "@/components/ui/role-dashboard-guard";
import { apiRequest } from "@/lib/api-client";
import { clearAuthSession } from "@/lib/session";
import { InternShell } from "@/components/dashboard/intern-shell";
import { SummaryStatCard } from "@/components/dashboard/summary-stat-card";
import { SectionPanel } from "@/components/dashboard/section-panel";

type ResumeSection = { key: string; label: string; score: number };

type ResumeAnalysis = {
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

type InternProfile = {
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

type Application = {
  _id: string;
  status: string;
  matchScore: number;
  internship: {
    _id: string;
    role: string;
    company?: { companyName?: string };
  };
  stageHistory: Array<{ stage: string; note: string; changedAt: string }>;
  hrFeedback: Array<{ feedback: string; createdAt: string }>;
};

type Recommendation = {
  internship: {
    _id: string;
    role: string;
    company?: { companyName?: string };
    location?: string;
  };
  recommendationScore: number;
  skillGap: { matched: string[]; missing: string[]; matchPercent: number };
};

export default function InternDashboardPage() {
  const router = useRouter();
  const resumeInputRef = useRef<HTMLInputElement | null>(null);

  const [profile, setProfile] = useState<InternProfile | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);

  const [loading, setLoading] = useState(true);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  const [editMode, setEditMode] = useState(false);
  const [editableName, setEditableName] = useState("");
  const [editableMobile, setEditableMobile] = useState("");
  const [editableSkills, setEditableSkills] = useState("");

  const resumeUploaded = Boolean(profile?.resumeUploaded);
  const resumeAnalysis = profile?.resume?.analysis;

  const summary = useMemo(() => {
    const resumeScore = profile?.resume?.score || 0;
    const openOpportunities = recommendations.length;
    const avgMatchScore = recommendations.length
      ? Math.round(recommendations.reduce((sum, item) => sum + item.recommendationScore, 0) / recommendations.length)
      : 0;
    const applicationsCount = applications.length;
    return { resumeScore, openOpportunities, avgMatchScore, applicationsCount };
  }, [profile, recommendations, applications]);

  const applicationStats = useMemo(() => {
    const total = applications.length;
    const inReview = applications.filter((a) => ["shortlisted", "screening", "interview", "offered"].includes(a.status)).length;
    const rejected = applications.filter((a) => a.status === "rejected").length;
    return { total, inReview, rejected };
  }, [applications]);

  async function loadData() {
    try {
      setLoading(true);
      setError(null);

      const profileResp = await apiRequest<{ profile: InternProfile }>("/api/intern/profile");
      const hydratedProfile = { ...profileResp.profile };

      if (hydratedProfile.resumeUploaded) {
        try {
          const scoreResp = await apiRequest<{
            score: number;
            scoreSource?: string;
            predictedCategory?: string;
            confidence?: number | null;
            analysis?: ResumeAnalysis;
          }>("/api/intern/resume/score");

          hydratedProfile.resume = {
            ...hydratedProfile.resume,
            score: scoreResp.score ?? hydratedProfile.resume.score,
            scoreSource: scoreResp.scoreSource || hydratedProfile.resume.scoreSource,
            predictedCategory: scoreResp.predictedCategory || hydratedProfile.resume.predictedCategory,
            confidence: typeof scoreResp.confidence === "number" ? scoreResp.confidence : hydratedProfile.resume.confidence,
            analysis: scoreResp.analysis || hydratedProfile.resume.analysis
          };
        } catch {
          // Keep dashboard stable if live score refresh fails.
        }
      }

      setProfile(hydratedProfile);
      setEditableName(hydratedProfile.fullName || "");
      setEditableMobile(hydratedProfile.mobile || "");
      setEditableSkills((hydratedProfile.skills || []).join(", "));

      const appsResp = await apiRequest<{ applications: Application[] }>("/api/intern/applications");
      setApplications(appsResp.applications || []);

      if (hydratedProfile.resumeUploaded) {
        const recResp = await apiRequest<{ recommendations: Recommendation[] }>("/api/intern/recommendations");
        setRecommendations(recResp.recommendations || []);
      } else {
        setRecommendations([]);
      }
    } catch (err) {
      setError((err as Error).message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleSaveProfile() {
    try {
      setSavingProfile(true);
      setInfoMessage(null);
      const skills = editableSkills
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

      const resp = await apiRequest<{ profile: InternProfile }>("/api/intern/profile", {
        method: "PUT",
        body: JSON.stringify({
          fullName: editableName,
          mobile: editableMobile,
          skills
        })
      });

      setProfile(resp.profile);
      setEditMode(false);
      setInfoMessage("Profile updated successfully.");
      await loadData();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleResumeUpload(file: File) {
    try {
      setUploadingResume(true);
      setInfoMessage(null);
      setError(null);

      const formData = new FormData();
      formData.append("resume", file);

      await apiRequest<{ message: string }>("/api/intern/resume/upload", {
        method: "POST",
        body: formData
      });

      setInfoMessage("Resume uploaded successfully.");
      await loadData();
    } catch (err) {
      setError((err as Error).message || "Resume upload failed");
    } finally {
      setUploadingResume(false);
    }
  }

  function handleLogout() {
    clearAuthSession();
    router.push("/auth?role=intern");
  }

  return (
    <RoleDashboardGuard expectedRole="intern">
      <InternShell welcomeName={profile?.fullName} onLogout={handleLogout}>
        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600">Loading your dashboard...</div>
        ) : (
          <div className="space-y-6">
            {error && <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}
            {infoMessage && <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{infoMessage}</div>}

            <section id="resume-score" className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <SummaryStatCard title="Resume Score" value={summary.resumeScore} suffix="/100" hint={`Source: ${profile?.resume?.scoreSource || "fallback"}`} />
              <SummaryStatCard title="Open Opportunities" value={summary.openOpportunities} />
              <SummaryStatCard title="Avg Match Score" value={summary.avgMatchScore} suffix="%" />
              <SummaryStatCard title="Applications Count" value={summary.applicationsCount} />
            </section>

            <SectionPanel id="edit-profile" title="Quick Actions" subtitle="Manage your profile, resume, and applications from one place.">
              <div className="flex flex-wrap gap-2">
                <Button type="button" size="sm" variant="secondary" onClick={() => setEditMode((prev) => !prev)}>
                  {editMode ? "Close Edit Profile" : "Edit Profile"}
                </Button>
                <Button type="button" size="sm" variant="secondary" onClick={() => resumeInputRef.current?.click()} disabled={uploadingResume}>
                  {uploadingResume ? "Uploading..." : "Upload Resume"}
                </Button>
                <Button type="button" size="sm" variant="secondary" onClick={() => router.push("/dashboard/intern/applications")}>
                  View Applications
                </Button>
              </div>
              <input
                ref={resumeInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.txt"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) handleResumeUpload(file);
                }}
              />
            </SectionPanel>

            {editMode && (
              <SectionPanel id="profile" title="Edit Profile" subtitle="Update your profile details used for matching.">
                <div className="grid gap-3 md:grid-cols-3">
                  <Input label="Full Name" value={editableName} onChange={(e) => setEditableName(e.target.value)} />
                  <Input label="Mobile" value={editableMobile} onChange={(e) => setEditableMobile(e.target.value)} />
                  <Input label="Skills (comma separated)" value={editableSkills} onChange={(e) => setEditableSkills(e.target.value)} />
                </div>
                <div className="mt-3 flex gap-2">
                  <Button type="button" size="sm" onClick={handleSaveProfile} disabled={savingProfile}>
                    {savingProfile ? "Saving..." : "Save Changes"}
                  </Button>
                  <Button type="button" size="sm" variant="secondary" onClick={() => setEditMode(false)}>
                    Cancel
                  </Button>
                </div>
              </SectionPanel>
            )}

            <div className="grid gap-6 xl:grid-cols-3">
              <div className="space-y-6 xl:col-span-2">
                <SectionPanel id="resume-analyzer" title="Resume Analyzer" subtitle="Structured analysis of your uploaded resume.">
                  {!resumeUploaded ? (
                    <p className="text-sm text-slate-600">Upload your resume to unlock resume score, match analysis, and recommendations.</p>
                  ) : !resumeAnalysis ? (
                    <p className="text-sm text-slate-600">Resume analysis is loading.</p>
                  ) : (
                    <>
                      <div className="space-y-2">
                        {(resumeAnalysis.sectionBreakdown || []).map((section) => (
                          <div key={section.key}>
                            <div className="mb-1 flex items-center justify-between text-xs text-slate-600">
                              <span>{section.label}</span>
                              <span className="font-semibold text-slate-800">{section.score}/100</span>
                            </div>
                            <div className="h-2 rounded-full bg-slate-100">
                              <div className="h-2 rounded-full bg-gradient-to-r from-primary-500 to-blue-500" style={{ width: `${Math.max(6, section.score)}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <div className="rounded-xl border border-emerald-100 bg-emerald-50/70 p-3">
                          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">Strengths</p>
                          <ul className="mt-2 space-y-1 text-xs text-emerald-900">
                            {(resumeAnalysis.strengths || []).slice(0, 3).map((item, idx) => (
                              <li key={`strength-${idx}`}>• {item}</li>
                            ))}
                            {(resumeAnalysis.strengths || []).length === 0 && <li>• Add more measurable project outcomes.</li>}
                          </ul>
                        </div>
                        <div className="rounded-xl border border-rose-100 bg-rose-50/70 p-3">
                          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-rose-700">Critical Fixes</p>
                          <ul className="mt-2 space-y-1 text-xs text-rose-900">
                            {(resumeAnalysis.criticalIssues || []).slice(0, 3).map((item, idx) => (
                              <li key={`issue-${idx}`}>• {item}</li>
                            ))}
                            {(resumeAnalysis.criticalIssues || []).length === 0 && <li>• No critical issue detected.</li>}
                          </ul>
                        </div>
                      </div>
                    </>
                  )}
                </SectionPanel>

                <SectionPanel id="recommended" title="Recommended Internships" subtitle="Prioritized opportunities based on your profile and resume score.">
                  {!resumeUploaded ? (
                    <p className="text-sm text-slate-600">Upload resume to view recommendations.</p>
                  ) : recommendations.length === 0 ? (
                    <p className="text-sm text-slate-600">No recommendations found yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {recommendations.slice(0, 5).map((item) => (
                        <div key={item.internship._id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-semibold text-slate-900">{item.internship.role}</p>
                            <p className="rounded-full bg-primary-50 px-2 py-1 text-xs font-semibold text-primary-700">{item.recommendationScore}%</p>
                          </div>
                          <p className="mt-1 text-xs text-slate-500">{item.internship.company?.companyName || "Company"}</p>
                          <p className="mt-1 text-xs text-slate-600">Missing skills: {item.skillGap.missing.join(", ") || "None"}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </SectionPanel>

                <SectionPanel id="progress" title="Application Progress" subtitle="Track your pipeline status across all applications.">
                  {applications.length === 0 ? (
                    <p className="text-sm text-slate-600">No applications yet. Apply to internships to track progress.</p>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-3">
                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">Total: {applicationStats.total}</div>
                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">In Progress: {applicationStats.inReview}</div>
                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">Rejected: {applicationStats.rejected}</div>
                    </div>
                  )}
                </SectionPanel>
              </div>

              <div className="space-y-6">
                <SectionPanel id="resume" title="Resume" subtitle="Uploaded resume and extraction status.">
                  {resumeUploaded ? (
                    <>
                      <p className="text-sm text-slate-700">Stored file: {profile?.resume?.filePath || "Uploaded"}</p>
                      {profile?.resume?.predictedCategory && (
                        <p className="mt-2 text-xs text-slate-600">Predicted category: {profile.resume.predictedCategory}</p>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-slate-600">No resume uploaded yet.</p>
                  )}
                </SectionPanel>

                <SectionPanel id="feedback" title="Feedback" subtitle="Latest HR feedback from your applications.">
                  {applications.some((app) => (app.hrFeedback || []).length > 0) ? (
                    <div className="space-y-2">
                      {applications
                        .flatMap((app) =>
                          (app.hrFeedback || []).map((f) => ({
                            internshipRole: app.internship?.role || "Internship",
                            feedback: f.feedback
                          }))
                        )
                        .slice(0, 3)
                        .map((item, index) => (
                          <p key={`${item.internshipRole}-${index}`} className="rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                            {item.internshipRole}: {item.feedback}
                          </p>
                        ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-600">No HR feedback yet.</p>
                  )}
                </SectionPanel>

                <SectionPanel id="support" title="Suggestions & Support" subtitle="Learning and support actions for your growth.">
                  <ul className="space-y-2 text-sm text-slate-700">
                    <li className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">Search Internships and Saved Internships sections are ready for integration.</li>
                    <li className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">Courses, Certifications, and Mock tests can be plugged to APIs next.</li>
                    <li className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">Use Help / Support for platform-related issues and mentor guidance.</li>
                  </ul>
                </SectionPanel>
              </div>
            </div>
          </div>
        )}
      </InternShell>
    </RoleDashboardGuard>
  );
}
