"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { RoleDashboardGuard } from "@/components/ui/role-dashboard-guard";
import { InternShell } from "@/components/dashboard/intern-shell";
import { SectionPanel } from "@/components/dashboard/section-panel";
import { Button } from "@/components/ui/button";
import { InternApplicationModal } from "@/components/dashboard/intern-application-modal";
import { clearAuthSession } from "@/lib/session";
import {
  InternshipListing,
  InternProfile,
  fetchActiveInternships,
  fetchInternApplications,
  fetchInternProfile,
  fetchSavedInternships,
  saveInternship,
  unsaveInternship
} from "@/lib/intern-portal";
import { normalizeSkillList, normalizeSkillValue } from "@/lib/skill-normalizer";

export default function SearchInternshipsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<InternProfile | null>(null);
  const [internships, setInternships] = useState<InternshipListing[]>([]);
  const [appliedInternshipIds, setAppliedInternshipIds] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [applyError, setApplyError] = useState<string | null>(null);
  const [applySuccess, setApplySuccess] = useState<string | null>(null);
  const [selectedInternship, setSelectedInternship] = useState<InternshipListing | null>(null);
  const [savedInternshipIds, setSavedInternshipIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError(null);

        const [loadedProfile, loadedInternships, loadedApplications, loadedSaved] = await Promise.all([
          fetchInternProfile(),
          fetchActiveInternships(true),
          fetchInternApplications(true),
          fetchSavedInternships(true)
        ]);

        setProfile(loadedProfile);
        setInternships(loadedInternships);

        const appliedIds = new Set<string>();
        loadedApplications.forEach((application) => {
          const internshipId = application.internshipId || application.internship?._id;
          if (internshipId) {
            appliedIds.add(String(internshipId));
          }
        });
        setAppliedInternshipIds(appliedIds);
        setSavedInternshipIds(new Set((loadedSaved || []).map((item) => String(item._id))));
      } catch (err) {
        setError((err as Error).message || "Failed to load internships.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const filtered = useMemo(() => {
    const rawTerm = query.trim().toLowerCase();
    const normalizedTerm = normalizeSkillValue(query);

    if (!rawTerm) return internships;

    return internships.filter((item) => {
      const role = String(item.role || "").toLowerCase();
      const company = String(item.company?.companyName || "").toLowerCase();
      const normalizedSkills = normalizeSkillList(item.skillsRequired || []);

      const roleOrCompanyMatch = role.includes(rawTerm) || company.includes(rawTerm);
      const skillMatch = normalizedTerm
        ? normalizedSkills.some((skill) => skill.includes(normalizedTerm))
        : false;

      return roleOrCompanyMatch || skillMatch;
    });
  }, [query, internships]);

  function openApplyModal(item: InternshipListing) {
    setApplyError(null);
    setApplySuccess(null);
    setSelectedInternship(item);
  }

  async function toggleSave(item: InternshipListing) {
    try {
      const internshipId = item._id;
      const isSaved = savedInternshipIds.has(internshipId);
      if (isSaved) {
        await unsaveInternship(internshipId);
        setSavedInternshipIds((prev) => {
          const next = new Set(prev);
          next.delete(internshipId);
          return next;
        });
        setApplySuccess(`Removed ${item.role} from saved internships.`);
      } else {
        await saveInternship(internshipId);
        setSavedInternshipIds((prev) => new Set([...prev, internshipId]));
        setApplySuccess(`Saved ${item.role}.`);
      }
      setApplyError(null);
    } catch (err) {
      setApplyError((err as Error).message || "Failed to update saved internships.");
    }
  }

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
            {!loading && !error && applyError && <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">{applyError}</div>}
            {!loading && !error && applySuccess && <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300">{applySuccess}</div>}

            {!loading && !error && internships.length === 0 && (
              <div className="surface-subtle px-4 py-3 text-sm text-slate-700 dark:text-slate-300">No internships posted yet.</div>
            )}

            {!loading && !error && internships.length > 0 && filtered.length === 0 && (
              <div className="surface-subtle px-4 py-3 text-sm text-slate-700 dark:text-slate-300">No results for this search.</div>
            )}

            {!loading && !error && filtered.length > 0 && (
              <div className="space-y-2">
                {filtered.map((item) => {
                  const internshipId = item._id;
                  const alreadyApplied = appliedInternshipIds.has(internshipId);
                  const isSaved = savedInternshipIds.has(internshipId);
                  return (
                    <div key={internshipId} className="surface-subtle px-4 py-3">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{item.role}</p>
                          <p className="text-xs text-slate-600 dark:text-slate-300">{item.company?.companyName || "Company"}</p>
                          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{item.location || "Location not specified"}</p>
                          <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                            Required skills: {(item.skillsRequired || []).length > 0 ? item.skillsRequired?.join(", ") : "Not specified"}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button type="button" size="sm" variant="secondary" onClick={() => toggleSave(item)}>
                            {isSaved ? "Unsave" : "Save"}
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant={alreadyApplied ? "secondary" : "primary"}
                            disabled={alreadyApplied}
                            onClick={() => openApplyModal(item)}
                          >
                            {alreadyApplied ? "Applied" : "Apply"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </SectionPanel>
        {selectedInternship && (
          <InternApplicationModal
            internship={selectedInternship}
            resumePath={profile?.resume?.filePath || ""}
            onClose={() => setSelectedInternship(null)}
            onSuccess={() => {
              setAppliedInternshipIds((prev) => new Set([...prev, selectedInternship._id]));
              setApplySuccess(`Application submitted for ${selectedInternship.role}.`);
              setSelectedInternship(null);
            }}
          />
        )}
      </InternShell>
    </RoleDashboardGuard>
  );
}

