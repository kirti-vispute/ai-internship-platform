"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RoleDashboardGuard } from "@/components/ui/role-dashboard-guard";
import { InternShell } from "@/components/dashboard/intern-shell";
import { SectionPanel } from "@/components/dashboard/section-panel";
import { clearAuthSession } from "@/lib/session";
import { InternProfile, Recommendation, fetchInternProfile, fetchInternRecommendations } from "@/lib/intern-portal";

export default function RecommendedInternshipsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<InternProfile | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const hasParsedResumeSkills = (profile?.resume?.parsed?.skills || []).length > 0;

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
        setError((err as Error).message || "Failed to load recommendations.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  function handleLogout() {
    clearAuthSession();
    router.push("/auth/intern");
  }

  return (
    <RoleDashboardGuard expectedRole="intern">
      <InternShell welcomeName={profile?.fullName} onLogout={handleLogout}>
        {loading ? (
          <div className="surface-muted p-5 text-sm text-slate-700 dark:text-slate-300">Loading recommendations...</div>
        ) : (
          <SectionPanel title="Recommended Internships" subtitle="Transparent recommendation model with separate required, preferred, and overall scoring.">
            {error && <p className="text-sm text-rose-700 dark:text-rose-300">{error}</p>}
            {!error && (!profile?.resumeUploaded || !hasParsedResumeSkills) && (
              <div className="surface-subtle px-4 py-3 text-sm text-slate-700 dark:text-slate-300">
                Upload your resume to get accurate AI internship recommendations.
              </div>
            )}
            {!error && profile?.resumeUploaded && hasParsedResumeSkills && recommendations.length === 0 && (
              <div className="surface-subtle px-4 py-3 text-sm text-slate-700 dark:text-slate-300">
                No matching internships found right now.
              </div>
            )}

            {!error && recommendations.length > 0 && (
              <div className="space-y-2.5">
                {recommendations.map((item) => (
                  <div key={item.internship._id} className="surface-subtle p-3.5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{item.internship.role}</p>
                        <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">{item.internship.company?.companyName || "Company"}</p>
                      </div>
                      <p className="rounded-full bg-primary-100/80 px-2 py-1 text-xs font-semibold text-primary-700 dark:bg-primary-900/40 dark:text-primary-300">
                        Overall Score {item.overallRecommendationScore}%
                      </p>
                    </div>

                    <div className="mt-2 grid gap-2 text-xs text-slate-700 dark:text-slate-300 sm:grid-cols-2">
                      <div className="surface-subtle px-2.5 py-2">Required Skill Match: {item.requiredSkillMatchPercent}%</div>
                      {item.preferredSkillMatchPercent !== null && (
                        <div className="surface-subtle px-2.5 py-2">Preferred Skill Match: {item.preferredSkillMatchPercent}%</div>
                      )}
                    </div>

                    <p className="mt-2 text-xs text-slate-600 dark:text-slate-300">
                      Missing required skills: {item.missingRequiredSkills.length > 0 ? item.missingRequiredSkills.join(", ") : "None"}
                    </p>

                    {item.preferredSkillMatchPercent !== null && (
                      <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                        Missing preferred skills: {item.missingPreferredSkills.length > 0 ? item.missingPreferredSkills.join(", ") : "None"}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </SectionPanel>
        )}
      </InternShell>
    </RoleDashboardGuard>
  );
}
