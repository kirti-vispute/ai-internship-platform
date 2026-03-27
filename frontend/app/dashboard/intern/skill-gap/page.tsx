"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { RoleDashboardGuard } from "@/components/ui/role-dashboard-guard";
import { InternShell } from "@/components/dashboard/intern-shell";
import { SectionPanel } from "@/components/dashboard/section-panel";
import { clearAuthSession } from "@/lib/session";
import { InternProfile, Recommendation, fetchInternProfile, fetchInternRecommendations } from "@/lib/intern-portal";

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
        if (loadedProfile.resumeUploaded) {
          setRecommendations(await fetchInternRecommendations());
        }
      } catch (err) {
        setError((err as Error).message || "Failed to load skill gap analysis.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const missingSkills = useMemo(() => {
    const allMissing = recommendations.flatMap((item) => item.skillGap?.missing || []);
    return [...new Set(allMissing)].slice(0, 8);
  }, [recommendations]);

  const courseSuggestions = useMemo(
    () => missingSkills.map((skill) => `Intro to ${skill[0]?.toUpperCase() || ""}${skill.slice(1)}`).slice(0, 6),
    [missingSkills]
  );

  function handleLogout() {
    clearAuthSession();
    router.push("/auth?role=intern");
  }

  return (
    <RoleDashboardGuard expectedRole="intern">
      <InternShell welcomeName={profile?.fullName} onLogout={handleLogout}>
        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600">Loading skill gap analysis...</div>
        ) : (
          <div className="space-y-6">
            {error && <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

            <SectionPanel title="Skill Gap Analysis" subtitle="Missing skills identified from internship recommendations.">
              {!profile?.resumeUploaded ? (
                <p className="text-sm text-slate-600">Upload your resume first to generate accurate skill gap analysis.</p>
              ) : missingSkills.length === 0 ? (
                <p className="text-sm text-slate-600">No major skill gaps detected from current recommendations.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {missingSkills.map((skill) => (
                    <span key={skill} className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
                      {skill}
                    </span>
                  ))}
                </div>
              )}
            </SectionPanel>

            <SectionPanel title="Suggested Courses" subtitle="Recommended learning tracks based on missing skills.">
              {courseSuggestions.length === 0 ? (
                <p className="text-sm text-slate-600">No course suggestions right now.</p>
              ) : (
                <ul className="space-y-2 text-sm text-slate-700">
                  {courseSuggestions.map((course) => (
                    <li key={course} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
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
