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
          <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600">Loading recommendations...</div>
        ) : (
          <SectionPanel title="Recommended Internships" subtitle="Backend-ranked opportunities based on your profile.">
            {error && <p className="text-sm text-rose-700">{error}</p>}
            {!error && !profile?.resumeUploaded && <p className="text-sm text-slate-600">Upload resume to unlock recommendations.</p>}
            {!error && profile?.resumeUploaded && recommendations.length === 0 && <p className="text-sm text-slate-600">No recommendations found.</p>}

            {!error && recommendations.length > 0 && (
              <div className="space-y-2">
                {recommendations.map((item) => (
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
        )}
      </InternShell>
    </RoleDashboardGuard>
  );
}

