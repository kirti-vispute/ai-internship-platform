"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { RoleDashboardGuard } from "@/components/ui/role-dashboard-guard";
import { InternShell } from "@/components/dashboard/intern-shell";
import { SectionPanel } from "@/components/dashboard/section-panel";
import { clearAuthSession } from "@/lib/session";
import { InternProfile, Recommendation, fetchInternProfile, fetchInternRecommendations } from "@/lib/intern-portal";
import { getSuggestedCoursesForSkills } from "@/lib/skill-course-map";
import { getMissingRequiredSkillsFromRecommendations } from "@/lib/recommendation-insights";

export default function InternSkillGapPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<InternProfile | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const loadedProfile = await fetchInternProfile();
        setProfile(loadedProfile);
        if (loadedProfile.resumeUploaded && (loadedProfile.resume?.parsed?.skills || []).length > 0) {
          setRecommendations(await fetchInternRecommendations(loadedProfile.resume?.parsed?.skills || [], true));
        } else {
          setRecommendations([]);
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

  const courseSuggestions = useMemo(() => getSuggestedCoursesForSkills(missingRequiredSkills), [missingRequiredSkills]);

  function handleLogout() {
    clearAuthSession();
    router.push("/auth/intern");
  }

  return (
    <RoleDashboardGuard expectedRole="intern">
      <InternShell welcomeName={profile?.fullName} onLogout={handleLogout}>
        {loading ? (
          <div className="surface-muted p-5 text-sm text-slate-700 dark:text-slate-300">Loading skill gap analysis...</div>
        ) : (
          <div className="space-y-5">
            {error && <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">{error}</div>}

            <SectionPanel title="Skill Gap Analysis" subtitle="Missing required skills identified from recommendation results.">
              {!profile?.resumeUploaded || (profile?.resume?.parsed?.skills || []).length === 0 ? (
                <div className="surface-subtle px-4 py-3 text-sm text-slate-700 dark:text-slate-300">Upload your resume to generate accurate skill gap analysis.</div>
              ) : missingRequiredSkills.length === 0 ? (
                <div className="surface-subtle px-4 py-3 text-sm text-slate-700 dark:text-slate-300">No critical skill gaps found from your current recommendations.</div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {missingRequiredSkills.map((skill) => (
                    <span key={skill} className="rounded-full border border-amber-300/60 bg-amber-100/60 px-3 py-1 text-xs font-semibold text-amber-800 dark:border-amber-700/50 dark:bg-amber-900/30 dark:text-amber-300">
                      {skill}
                    </span>
                  ))}
                </div>
              )}
            </SectionPanel>

            <SectionPanel title="Suggested Courses" subtitle="Learning tracks based on missing required skills.">
              {!profile?.resumeUploaded || (profile?.resume?.parsed?.skills || []).length === 0 ? (
                <div className="surface-subtle px-4 py-3 text-sm text-slate-700 dark:text-slate-300">Upload your resume to unlock skill-based free course suggestions.</div>
              ) : missingRequiredSkills.length === 0 ? (
                <div className="surface-subtle px-4 py-3 text-sm text-slate-700 dark:text-slate-300">No critical skill gaps found from your current recommendations.</div>
              ) : courseSuggestions.suggestions.length === 0 && courseSuggestions.unmappedSkills.length > 0 ? (
                <div className="surface-subtle space-y-1 px-4 py-3 text-sm text-slate-700 dark:text-slate-300">
                  {courseSuggestions.unmappedSkills.map((skill) => (
                    <p key={skill}>No direct Coursera/NPTEL course mapped yet for this skill: {skill}</p>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {courseSuggestions.unmappedSkills.length > 0 && (
                    <div className="surface-subtle space-y-1 px-4 py-3 text-sm text-slate-700 dark:text-slate-300">
                      {courseSuggestions.unmappedSkills.map((skill) => (
                        <p key={skill}>No direct Coursera/NPTEL course mapped yet for this skill: {skill}</p>
                      ))}
                    </div>
                  )}

                  {courseSuggestions.suggestions.length > 0 && (
                    <div className="grid gap-3 md:grid-cols-2">
                      {courseSuggestions.suggestions.map((course) => (
                        <article key={`${course.url}`} className="surface-subtle p-3">
                          <p className="text-xs font-semibold uppercase tracking-wide text-primary-700 dark:text-primary-300">{course.platform}</p>
                          <h3 className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">{course.title}</h3>
                          <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">Target skills: {course.targetSkills.join(", ")}</p>
                          <a
                            href={course.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-2 inline-flex rounded-lg border border-primary-300 px-2.5 py-1.5 text-xs font-semibold text-primary-700 transition hover:bg-primary-100/70 dark:border-primary-700 dark:text-primary-300 dark:hover:bg-primary-900/30"
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
          </div>
        )}
      </InternShell>
    </RoleDashboardGuard>
  );
}


