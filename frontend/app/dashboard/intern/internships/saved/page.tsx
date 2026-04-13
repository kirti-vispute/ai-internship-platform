"use client";

import { useRouter } from "next/navigation";
import { RoleDashboardGuard } from "@/components/ui/role-dashboard-guard";
import { InternShell } from "@/components/dashboard/intern-shell";
import { SectionPanel } from "@/components/dashboard/section-panel";
import { Button } from "@/components/ui/button";
import { clearAuthSession } from "@/lib/session";
import { useEffect, useState } from "react";
import { InternshipListing, InternProfile, fetchInternProfile, fetchSavedInternships, unsaveInternship } from "@/lib/intern-portal";

export default function SavedInternshipsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<InternProfile | null>(null);
  const [saved, setSaved] = useState<InternshipListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const [loadedProfile, loadedSaved] = await Promise.all([fetchInternProfile(), fetchSavedInternships(true)]);
        setProfile(loadedProfile);
        setSaved(loadedSaved);
      } catch (e) {
        setError((e as Error).message || "Failed to load saved internships.");
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
        <SectionPanel title="Saved Internships" subtitle="Track opportunities you want to revisit.">
          {loading && <div className="surface-subtle px-4 py-3 text-sm text-slate-700 dark:text-slate-300">Loading saved internships...</div>}
          {error && <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">{error}</div>}
          {!loading && !error && saved.length === 0 && (
            <div className="surface-subtle flex flex-col gap-3 px-4 py-4 text-sm text-slate-700 dark:text-slate-300">
              <p>No saved internships yet.</p>
              <div>
                <Button type="button" size="sm" variant="secondary" onClick={() => router.push("/dashboard/intern/internships/search")}>
                  Browse Internships
                </Button>
              </div>
            </div>
          )}
          {!loading && !error && saved.length > 0 && (
            <div className="space-y-3">
              {saved.map((item) => (
                <div key={item._id} className="surface-subtle flex flex-wrap items-start justify-between gap-3 px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{item.role}</p>
                    <p className="text-xs text-slate-600 dark:text-slate-300">{item.company?.companyName || "Company"}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{item.location || "Location not specified"}</p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={async () => {
                      try {
                        await unsaveInternship(item._id);
                        setSaved((prev) => prev.filter((savedItem) => savedItem._id !== item._id));
                      } catch (e) {
                        setError((e as Error).message || "Failed to unsave internship.");
                      }
                    }}
                  >
                    Unsave
                  </Button>
                </div>
              ))}
            </div>
          )}
        </SectionPanel>
      </InternShell>
    </RoleDashboardGuard>
  );
}
