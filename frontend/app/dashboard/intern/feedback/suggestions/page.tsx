"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { RoleDashboardGuard } from "@/components/ui/role-dashboard-guard";
import { InternShell } from "@/components/dashboard/intern-shell";
import { SectionPanel } from "@/components/dashboard/section-panel";
import { clearAuthSession } from "@/lib/session";
import { Application, InternProfile, Recommendation, fetchInternApplications, fetchInternProfile, fetchInternRecommendations } from "@/lib/intern-portal";

export default function SuggestionsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<InternProfile | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
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
        setApplications(await fetchInternApplications());

        if (loadedProfile.resumeUploaded && (loadedProfile.resume?.parsed?.skills || []).length > 0) {
          setRecommendations(await fetchInternRecommendations());
        }
      } catch (err) {
        setError((err as Error).message || "Failed to load suggestions.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const missingSkills = useMemo(() => {
    const items = recommendations.flatMap((item) => item.skillGap?.missing || []);
    return [...new Set(items)].slice(0, 3);
  }, [recommendations]);

  const actionableSuggestions = useMemo(() => {
    const suggestions: string[] = [];
    if (!profile?.resumeUploaded || (profile?.resume?.parsed?.skills || []).length === 0) {
      suggestions.push("Upload your resume to unlock skill-matched recommendations.");
    }
    if (missingSkills.length > 0) {
      suggestions.push(`Prioritize learning these skills next: ${missingSkills.join(", ")}.`);
    }
    if (applications.length === 0) {
      suggestions.push("Start by applying to at least one recommended internship this week.");
    }

    if (suggestions.length === 0) {
      suggestions.push("Your profile is in good shape. Keep applying to high skill-match internships.");
    }

    return suggestions;
  }, [profile, missingSkills, applications]);

  const handleLogout = () => {
    clearAuthSession();
    router.push("/auth/intern");
  };

  return (
    <RoleDashboardGuard expectedRole="intern">
      <InternShell welcomeName={profile?.fullName} onLogout={handleLogout}>
        {loading ? (
          <div className="surface-muted p-5 text-sm text-slate-700 dark:text-slate-300">Loading suggestions...</div>
        ) : (
          <SectionPanel title="Suggestions" subtitle="Generated from your real resume, applications, and recommendation data.">
            {error && <p className="text-sm text-rose-700 dark:text-rose-300">{error}</p>}
            {!error && (
              <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
                {actionableSuggestions.map((item, idx) => (
                  <li key={`suggestion-${idx}`} className="surface-subtle px-3 py-2">
                    {item}
                  </li>
                ))}
              </ul>
            )}
          </SectionPanel>
        )}
      </InternShell>
    </RoleDashboardGuard>
  );
}
