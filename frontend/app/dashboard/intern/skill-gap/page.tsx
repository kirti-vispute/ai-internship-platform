"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { RoleDashboardGuard } from "@/components/ui/role-dashboard-guard";
import { InternShell } from "@/components/dashboard/intern-shell";
import { SectionPanel } from "@/components/dashboard/section-panel";
import { clearAuthSession } from "@/lib/session";
import { InternProfile, Recommendation, fetchInternProfile, fetchInternRecommendations } from "@/lib/intern-portal";
import { toDisplaySkillList } from "@/lib/skill-normalizer";

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
          setRecommendations(await fetchInternRecommendations());
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
    const allMissing = recommendations.flatMap((item) => item.missingRequiredSkills || []);
    return toDisplaySkillList(allMissing).slice(0, 12);
  }, [recommendations]);

  const courseSuggestions = useMemo(
    () => missingRequiredSkills.map((skill) => `Intro to ${skill[0]?.toUpperCase() || ""}${skill.slice(1)}`).slice(0, 6),
    [missingRequiredSkills]
  );

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
                <div className="surface-subtle px-4 py-3 text-sm text-slate-700 dark:text-slate-300">Missing required skills: None</div>
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
              {courseSuggestions.length === 0 ? (
                <div className="surface-subtle px-4 py-3 text-sm text-slate-700 dark:text-slate-300">No course suggestions yet.</div>
              ) : (
                <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-200">
                  {courseSuggestions.map((course) => (
                    <li key={course} className="surface-subtle px-3 py-2">
                      {course}
                    </li>
                  ))}
                </ul>
              )}
            </SectionPanel>
          </div>
        )}
      </InternShell>
    </RoleDashboardGuard>
  );
}
