"use client";

import { useEffect, useMemo, useState } from "react";
import { SectionPanel } from "@/components/dashboard/section-panel";
import { CareerRoadmap, InternProfile, Recommendation, fetchInternProfile, fetchInternRecommendations, generateCareerRoadmap, peekInternProfile } from "@/lib/intern-portal";
import { getSuggestedCoursesForMissingSkills } from "@/lib/course-recommendation";
import { getMissingRequiredSkillsFromRecommendations } from "@/lib/recommendation-insights";
import { FEATURE_FLAGS } from "@/constants/featureFlags";

export default function InternSkillGapPage() {
  const [profile, setProfile] = useState<InternProfile | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(() => typeof window === "undefined" ? true : !peekInternProfile());
  const [error, setError] = useState<string | null>(null);
  const [targetRole, setTargetRole] = useState("full_stack_developer");
  const [roadmap, setRoadmap] = useState<CareerRoadmap | null>(null);
  const [roadmapLoading, setRoadmapLoading] = useState(false);
  const [roadmapError, setRoadmapError] = useState<string | null>(null);

  async function loadRoadmap(role: string) {
    try {
      setRoadmapLoading(true);
      setRoadmapError(null);
      const nextRoadmap = await generateCareerRoadmap(role);
      setRoadmap(nextRoadmap);
      if (!nextRoadmap) setRoadmapError("Could not generate roadmap for this role.");
    } catch (err) {
      setRoadmap(null);
      setRoadmapError((err as Error).message || "Failed to load career roadmap.");
    } finally {
      setRoadmapLoading(false);
    }
  }

  useEffect(() => {
    async function load() {
      try {
        if (!peekInternProfile()) setLoading(true);
        setError(null);
        const loadedProfile = await fetchInternProfile();
        setProfile(loadedProfile);
        if (loadedProfile.resumeUploaded && (loadedProfile.resume?.parsed?.skills || []).length > 0) {
          const [loadedRecommendations] = await Promise.all([
            fetchInternRecommendations(loadedProfile.resume?.parsed?.skills || [], true),
            loadRoadmap("full_stack_developer")
          ]);
          setRecommendations(loadedRecommendations);
        } else {
          setRecommendations([]);
          setRoadmap(null);
        }
      } catch (err) {
        setError((err as Error).message || "Failed to load skill gap analysis.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const missingRequiredSkills = useMemo(() => {
    return getMissingRequiredSkillsFromRecommendations(recommendations);
  }, [recommendations]);

  const courseSuggestions = useMemo(() => getSuggestedCoursesForMissingSkills(missingRequiredSkills), [missingRequiredSkills]);

  return (
    <>
      {loading ? (
        <div className="surface-muted p-5 text-sm text-slate-300">Loading skill gap analysis...</div>
      ) : (
        <div className="space-y-5">
          {error && <div className="rounded-xl border border-rose-900/60 bg-rose-950/40 px-4 py-3 text-sm text-rose-300">{error}</div>}

          <SectionPanel title="Skill Gap Analysis" subtitle="Missing required skills identified from recommendation results.">
            {!FEATURE_FLAGS.ENABLE_AI ? (
              <div className="surface-subtle px-4 py-3 text-sm text-slate-300">AI features are currently disabled.</div>
            ) : !profile?.resumeUploaded || (profile?.resume?.parsed?.skills || []).length === 0 ? (
              <div className="surface-subtle px-4 py-3 text-sm text-slate-300">Upload your resume to generate accurate skill gap analysis.</div>
            ) : missingRequiredSkills.length === 0 ? (
              <div className="surface-subtle px-4 py-3 text-sm text-slate-300">No critical skill gaps found from your current recommendations.</div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {missingRequiredSkills.map((skill) => (
                  <span key={skill} className="rounded-full border border-amber-700/50 bg-amber-900/30 px-3 py-1 text-xs font-semibold text-amber-300">
                    {skill}
                  </span>
                ))}
              </div>
            )}
          </SectionPanel>

          <SectionPanel title="Suggested Courses" subtitle="Learning tracks based on missing required skills.">
            {!profile?.resumeUploaded || (profile?.resume?.parsed?.skills || []).length === 0 ? (
              <div className="surface-subtle px-4 py-3 text-sm text-slate-300">Upload your resume to unlock skill-based free course suggestions.</div>
            ) : missingRequiredSkills.length === 0 ? (
              <div className="surface-subtle px-4 py-3 text-sm text-slate-300">No critical skill gaps found from your current recommendations.</div>
            ) : courseSuggestions.suggestions.length === 0 && courseSuggestions.unmappedSkills.length > 0 ? (
              <div className="surface-subtle space-y-1 px-4 py-3 text-sm text-slate-300">
                {courseSuggestions.unmappedSkills.map((skill) => (
                  <p key={skill}>No highly relevant NPTEL course mapped yet for this skill: {skill}</p>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {courseSuggestions.unmappedSkills.length > 0 && (
                  <div className="surface-subtle space-y-1 px-4 py-3 text-sm text-slate-300">
                    {courseSuggestions.unmappedSkills.map((skill) => (
                      <p key={skill}>No highly relevant NPTEL course mapped yet for this skill: {skill}</p>
                    ))}
                  </div>
                )}

                {courseSuggestions.suggestions.length > 0 && (
                  <div className="grid gap-3 md:grid-cols-2">
                    {courseSuggestions.suggestions.map((course) => (
                      <article key={`${course.url}`} className="surface-subtle p-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-primary-300">{course.platform}</p>
                        <h3 className="mt-1 text-sm font-semibold text-slate-100">{course.title}</h3>
                        <p className="mt-1 text-xs text-slate-300">Target skills: {course.targetSkills.join(", ")}</p>
                        <p className="mt-1 text-xs text-slate-300">Relevance: {Math.round(course.similarityScore * 100)}%</p>
                        <a
                          href={course.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 inline-flex rounded-lg border border-primary-700 px-2.5 py-1.5 text-xs font-semibold text-primary-300 transition hover:bg-primary-900/30"
                        >
                          Open free course
                        </a>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            )}
          </SectionPanel>

          <SectionPanel title="Career Roadmap" subtitle="AI-powered role-based progression plan.">
            <div className="mb-3 flex items-center gap-2">
              <select
                className="surface-input px-3 py-2 text-sm"
                value={targetRole}
                onChange={(e) => {
                  const nextRole = e.target.value;
                  setTargetRole(nextRole);
                  void loadRoadmap(nextRole);
                }}
              >
                <option value="full_stack_developer">Full Stack Developer</option>
                <option value="frontend_developer">Frontend Developer</option>
                <option value="backend_developer">Backend Developer</option>
              </select>
            </div>
            {roadmapLoading ? (
              <div className="surface-subtle px-4 py-3 text-sm text-slate-300">Generating roadmap...</div>
            ) : roadmapError ? (
              <div className="surface-subtle px-4 py-3 text-sm text-rose-300">{roadmapError}</div>
            ) : !roadmap ? (
              <div className="surface-subtle px-4 py-3 text-sm text-slate-300">Upload your resume to generate a career roadmap.</div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-slate-300">
                  Match: <span className="font-semibold text-slate-100">{roadmap.matchPercent}%</span> | Missing skills:{" "}
                  {roadmap.missingSkills.join(", ") || "None"}
                </p>
                {(roadmap.roadmap || []).map((item) => (
                  <div key={`${item.skill}-${item.phase}`} className="surface-subtle rounded-lg p-3">
                    <p className="text-sm font-semibold text-slate-100">{item.skill}</p>
                    <p className="text-xs capitalize text-slate-400">
                      Priority: {item.priority} | Phase: {item.phase}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </SectionPanel>
        </div>
      )}
    </>
  );
}
