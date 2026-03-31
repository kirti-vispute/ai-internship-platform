"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { RoleDashboardGuard } from "@/components/ui/role-dashboard-guard";
import { InternShell } from "@/components/dashboard/intern-shell";
import { SectionPanel } from "@/components/dashboard/section-panel";
import { clearAuthSession } from "@/lib/session";
import { InternshipListing, InternProfile, fetchActiveInternships, fetchInternProfile } from "@/lib/intern-portal";

export default function SearchInternshipsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<InternProfile | null>(null);
  const [internships, setInternships] = useState<InternshipListing[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const [loadedProfile, loadedInternships] = await Promise.all([fetchInternProfile(), fetchActiveInternships(true)]);
        setProfile(loadedProfile);
        setInternships(loadedInternships);
      } catch (err) {
        setError((err as Error).message || "Failed to load internships.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return internships;
    return internships.filter((item) => {
      const role = String(item.role || "").toLowerCase();
      const company = String(item.company?.companyName || "").toLowerCase();
      const skills = (item.skillsRequired || []).join(" ").toLowerCase();
      return role.includes(term) || company.includes(term) || skills.includes(term);
    });
  }, [query, internships]);

  function handleLogout() {
    clearAuthSession();
    router.push("/auth/intern");
  }

  return (
    <RoleDashboardGuard expectedRole="intern">
      <InternShell welcomeName={profile?.fullName} onLogout={handleLogout}>
        <SectionPanel title="Search Internships" subtitle="Explore active internships from verified company postings.">
          <div className="space-y-3">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by role, company, or required skill"
              className="surface-subtle w-full px-3 py-2 text-sm"
            />

            {loading && <div className="surface-subtle px-4 py-3 text-sm text-slate-700 dark:text-slate-300">Loading internships...</div>}
            {!loading && error && <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">{error}</div>}

            {!loading && !error && internships.length === 0 && (
              <div className="surface-subtle px-4 py-3 text-sm text-slate-700 dark:text-slate-300">No internships posted yet.</div>
            )}

            {!loading && !error && internships.length > 0 && filtered.length === 0 && (
              <div className="surface-subtle px-4 py-3 text-sm text-slate-700 dark:text-slate-300">No results for this search.</div>
            )}

            {!loading && !error && filtered.length > 0 && (
              <div className="space-y-2">
                {filtered.map((item) => (
                  <div key={item._id} className="surface-subtle px-4 py-3">
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{item.role}</p>
                    <p className="text-xs text-slate-600 dark:text-slate-300">{item.company?.companyName || "Company"}</p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{item.location || "Location not specified"}</p>
                    <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                      Required skills: {(item.skillsRequired || []).length > 0 ? item.skillsRequired?.join(", ") : "Not specified"}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </SectionPanel>
      </InternShell>
    </RoleDashboardGuard>
  );
}
