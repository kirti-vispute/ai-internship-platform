"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { RoleDashboardGuard } from "@/components/ui/role-dashboard-guard";
import { apiRequest } from "@/lib/api-client";
import { clearAuthSession } from "@/lib/session";

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

function scoreColor(score: number) {
  if (score >= 80) return "text-emerald-700 bg-emerald-100";
  if (score >= 60) return "text-amber-700 bg-amber-100";
  return "text-rose-700 bg-rose-100";
}

export default function InternDashboardPage() {
  const router = useRouter();
  const resumeInputRef = useRef<HTMLInputElement | null>(null);
  const recommendationsRef = useRef<HTMLDivElement | null>(null);
  const progressRef = useRef<HTMLDivElement | null>(null);

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

  const summary = useMemo(() => {
    const resumeScore = profile?.resume?.score || 0;
    const openOpportunities = recommendations.length;
    const avgMatchScore = recommendations.length
      ? Math.round(recommendations.reduce((sum, item) => sum + item.recommendationScore, 0) / recommendations.length)
      : 0;

    return { resumeScore, openOpportunities, avgMatchScore };
  }, [profile, recommendations]);

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
          // Keep dashboard usable even if score refresh endpoint is down.
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

      setInfoMessage("Resume uploaded successfully. Analyzer has been refreshed.");
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

  if (loading) {
    return (
      <main>
        <Navbar />
        <RoleDashboardGuard expectedRole="intern">
          <section className="container-shell py-12">
            <Card>
              <p className="text-sm text-slate-600">Loading your dashboard...</p>
            </Card>
          </section>
        </RoleDashboardGuard>
        <Footer />
      </main>
    );
  }

  const resumeAnalysis = profile?.resume?.analysis;

  return (
    <main>
      <Navbar />
      <RoleDashboardGuard expectedRole="intern">
        <section className="container-shell py-10 sm:py-14">
          <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-primary-600">Intern Dashboard</p>
              <h1 className="text-3xl font-black tracking-tight text-ink sm:text-4xl">Welcome, {profile?.fullName || "Intern"}</h1>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/auth?role=intern" className="rounded-full bg-white px-3 py-1 text-sm font-medium text-primary-600 shadow-soft hover:text-primary-700">
                Switch account
              </Link>
              <Button type="button" variant="secondary" size="sm" onClick={handleLogout}>
                LogOut
              </Button>
            </div>
          </div>

          {error && (
            <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          )}
          {infoMessage && (
            <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {infoMessage}
            </div>
          )}

          <div className="mb-4 rounded-2xl border border-primary-100 bg-gradient-to-r from-primary-600 to-blue-600 p-4 text-white shadow-glow">
            <p className="text-sm font-semibold">Quick Actions</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold hover:bg-white/30" onClick={() => setEditMode((prev) => !prev)}>
                Edit Profile
              </button>
              <button
                className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold hover:bg-white/30"
                onClick={() => resumeInputRef.current?.click()}
                disabled={uploadingResume}
              >
                {uploadingResume ? "Uploading..." : "Upload Resume"}
              </button>
              <button className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold hover:bg-white/30" onClick={() => router.push("/dashboard/intern/applications")}>
                View Applications
              </button>
              <button className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold hover:bg-white/30" onClick={() => progressRef.current?.scrollIntoView({ behavior: "smooth" })}>
                Track Progress
              </button>
              <button className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold hover:bg-white/30" onClick={() => recommendationsRef.current?.scrollIntoView({ behavior: "smooth" })}>
                View Recommendations
              </button>
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
          </div>

          {editMode && (
            <Card className="mb-4" title="Edit Profile">
              <div className="grid gap-3 sm:grid-cols-3">
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
            </Card>
          )}

          {resumeUploaded ? (
            <div className="mb-5 grid gap-4 sm:grid-cols-3">
              <Card className="border-none bg-white">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-600">Resume Score</p>
                <div className="mt-2 flex items-center gap-2">
                  <p className="text-2xl font-black text-ink">{summary.resumeScore}/100</p>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${scoreColor(summary.resumeScore)}`}>
                    {summary.resumeScore >= 80 ? "Strong" : summary.resumeScore >= 60 ? "Good" : "Needs Work"}
                  </span>
                </div>
                <p className="mt-2 text-xs text-slate-500">Source: {profile?.resume?.scoreSource || "fallback"}</p>
              </Card>
              <Card className="border-none bg-white">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-600">Open Opportunities</p>
                <p className="mt-2 text-2xl font-black text-ink">{summary.openOpportunities}</p>
              </Card>
              <Card className="border-none bg-white">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-600">Avg Match Score</p>
                <p className="mt-2 text-2xl font-black text-ink">{summary.avgMatchScore}%</p>
              </Card>
            </div>
          ) : (
            <Card className="mb-5 border-primary-100 bg-primary-50/60">
              <p className="text-sm font-semibold text-primary-700">Upload your resume to unlock resume score, match analysis, and recommendations.</p>
            </Card>
          )}

          <div className="grid gap-4 lg:grid-cols-3">
            <div className="space-y-4 lg:col-span-2">
              <Card title="Profile" subtitle="Your real account data from database">
                {profile ? (
                  <div className="grid gap-2 text-sm sm:grid-cols-2">
                    <p className="text-slate-700">
                      Email: <span className="font-semibold">{profile.email}</span>
                    </p>
                    <p className="text-slate-700">
                      Mobile: <span className="font-semibold">{profile.mobile || "-"}</span>
                    </p>
                    <p className="text-slate-700">
                      Skills: <span className="font-semibold">{(profile.skills || []).join(", ") || "-"}</span>
                    </p>
                    <p className="text-slate-700">
                      Courses: <span className="font-semibold">{(profile.completedCourses || []).length}</span>
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-slate-600">No profile data found.</p>
                )}
              </Card>

              {resumeUploaded && resumeAnalysis && (
                <Card title="Resume Analyzer" subtitle="Enhancv-style section breakdown and improvements">
                  {Array.isArray(resumeAnalysis.warnings) && resumeAnalysis.warnings.length > 0 && (
                    <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                      {resumeAnalysis.warnings[0]}
                    </div>
                  )}

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
                      <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Strengths</p>
                      <ul className="mt-2 space-y-1 text-xs text-emerald-900">
                        {(resumeAnalysis.strengths || []).slice(0, 3).map((item, idx) => (
                          <li key={`strength-${idx}`}>• {item}</li>
                        ))}
                        {(resumeAnalysis.strengths || []).length === 0 && <li>• Add more measurable project outcomes.</li>}
                      </ul>
                    </div>

                    <div className="rounded-xl border border-rose-100 bg-rose-50/70 p-3">
                      <p className="text-xs font-semibold uppercase tracking-wider text-rose-700">Critical Fixes</p>
                      <ul className="mt-2 space-y-1 text-xs text-rose-900">
                        {(resumeAnalysis.criticalIssues || []).slice(0, 3).map((item, idx) => (
                          <li key={`issue-${idx}`}>• {item}</li>
                        ))}
                        {(resumeAnalysis.criticalIssues || []).length === 0 && <li>• No critical issue detected.</li>}
                      </ul>
                    </div>
                  </div>

                  <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-600">Top Improvements</p>
                    <ul className="mt-2 space-y-1 text-xs text-slate-700">
                      {(resumeAnalysis.improvements || []).slice(0, 4).map((item, idx) => (
                        <li key={`improvement-${idx}`}>• {item}</li>
                      ))}
                    </ul>
                  </div>
                </Card>
              )}

              <div ref={recommendationsRef}>
                <Card title="Recommended Internships" subtitle="Ranked from backend AI recommendation logic">
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
                </Card>
              </div>

              <div ref={progressRef}>
                <Card title="Application Progress" subtitle="Live statuses from your real applications">
                  {applications.length === 0 ? (
                    <p className="text-sm text-slate-600">No applications yet. Apply to internships to track progress.</p>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-3">
                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">Total: {applicationStats.total}</div>
                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">In Progress: {applicationStats.inReview}</div>
                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">Rejected: {applicationStats.rejected}</div>
                    </div>
                  )}
                </Card>
              </div>
            </div>

            <div className="space-y-4">
              <Card title="Resume" subtitle="Uploaded resume details">
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
              </Card>

              <Card title="Feedback" subtitle="Latest HR feedback">
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
              </Card>
            </div>
          </div>
        </section>
      </RoleDashboardGuard>
      <Footer />
    </main>
  );
}