"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { RoleDashboardGuard } from "@/components/ui/role-dashboard-guard";
import { InternShell } from "@/components/dashboard/intern-shell";
import { SectionPanel } from "@/components/dashboard/section-panel";
import { clearAuthSession } from "@/lib/session";
import { InternProfile, Recommendation, fetchInternProfile, fetchInternRecommendations } from "@/lib/intern-portal";
import { computeSkillMatch } from "@/lib/skill-normalizer";

export default function RecommendedInternshipsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<InternProfile | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const parsedSkills = profile?.resume?.parsed?.skills || [];
  const hasParsedResumeSkills = parsedSkills.length > 0;

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError(null);

        const loadedProfile = await fetchInternProfile();
        setProfile(loadedProfile);

        const internSkills = loadedProfile.resume?.parsed?.skills || [];
        if (loadedProfile.resumeUploaded && internSkills.length > 0) {
          setRecommendations(await fetchInternRecommendations(internSkills, true));
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

  const liveRecommendations = useMemo(() => {
    return recommendations.map((item) => {
      const match = computeSkillMatch(
        parsedSkills,
        item.internship.skillsRequired || [],
        item.internship.prioritySkills || []
      );

      if (process.env.NODE_ENV !== "production") {
        // Temporary debug proof for recommendation correctness.
        // eslint-disable-next-line no-console
        console.debug("[recommendation-ui-debug]", {
          internshipId: item.internship._id,
          internshipRole: item.internship.role,
          normalizedInternSkills: match.normalizedInternSkills,
          normalizedRequiredSkills: match.normalizedRequiredSkills,
          matchedRequiredSkills: match.matchedRequiredSkills,
          missingRequiredSkills: match.missingRequiredSkills,
          requiredMatch: match.requiredMatchPercent
        });
      }

      return {
        internship: item.internship,
        requiredSkillMatchPercent: match.requiredMatchPercent,
        preferredSkillMatchPercent: match.preferredMatchPercent,
        overallRecommendationScore: match.overallScore,
        matchedRequiredSkills: match.matchedRequiredSkills,
        missingRequiredSkills: match.missingRequiredSkills,
        matchedPreferredSkills: match.matchedPreferredSkills,
        missingPreferredSkills: match.missingPreferredSkills
      };
    });
  }, [recommendations, parsedSkills]);

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
            {!error && profile?.resumeUploaded && hasParsedResumeSkills && liveRecommendations.length === 0 && (
              <div className="surface-subtle px-4 py-3 text-sm text-slate-700 dark:text-slate-300">
                No matching internships found right now.
              </div>
            )}

            {!error && liveRecommendations.length > 0 && (
              <div className="space-y-2.5">
                {liveRecommendations.map((item) => (
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
