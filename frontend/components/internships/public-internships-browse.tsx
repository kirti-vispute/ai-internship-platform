"use client";

import Link from "next/link";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { MapPin } from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { SearchInput } from "@/components/ui/search-input";
import { EmptyState } from "@/components/dashboard/shared/empty-state";
import { SkeletonList } from "@/components/ui/skeleton";
import { fetchPublicInternships, type InternshipListing } from "@/lib/public-internships";
import { normalizeSkillList, normalizeSkillValue } from "@/lib/skill-normalizer";

const card =
  "block rounded-2xl border border-[var(--ds-border)] bg-[var(--ds-card)] p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-shadow duration-200 hover:shadow-[0_8px_24px_rgba(15,23,42,0.08)]";

export function PublicInternshipsBrowse() {
  const [internships, setInternships] = useState<InternshipListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [filterMode, setFilterMode] = useState("");
  const [filterLocation, setFilterLocation] = useState("");

  useEffect(() => {
    let active = true;
    fetchPublicInternships()
      .then((data) => {
        if (active) setInternships(data);
      })
      .catch((err) => {
        if (active) setError((err as Error).message || "Failed to load internships.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const deferredQuery = useDeferredValue(query);

  const filtered = useMemo(() => {
    const rawTerm = deferredQuery.trim().toLowerCase();
    const normalizedTerm = normalizeSkillValue(deferredQuery);

    return internships.filter((item) => {
      const modeMatch = filterMode ? String(item.mode || "") === filterMode : true;
      const locationMatch = filterLocation
        ? String(item.location || "").toLowerCase().includes(filterLocation.toLowerCase())
        : true;
      if (!modeMatch || !locationMatch) return false;
      if (!rawTerm) return true;

      const role = String(item.role || "").toLowerCase();
      const company = String(item.company?.companyName || "").toLowerCase();
      const normalizedSkills = normalizeSkillList(item.skillsRequired || []);

      const roleOrCompanyMatch = role.includes(rawTerm) || company.includes(rawTerm);
      const skillMatch = normalizedTerm ? normalizedSkills.some((skill) => skill.includes(normalizedTerm)) : false;

      return roleOrCompanyMatch || skillMatch;
    });
  }, [deferredQuery, internships, filterMode, filterLocation]);

  return (
    <main id="main-content" tabIndex={-1} className="min-h-screen bg-[var(--ds-bg)] text-[var(--ds-text)] focus:outline-none">
      <Navbar />

      <div className="container-shell py-12 sm:py-16">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--ds-muted)]">Opportunities</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Browse internships &amp; jobs</h1>
          <p className="mt-3 text-sm text-[var(--ds-muted)]">
            Open roles from verified companies. Anyone can browse — sign in as an intern to apply.
          </p>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          <SearchInput
            value={query}
            onValueChange={setQuery}
            placeholder="Search by role, company, or skill"
            containerClassName="sm:col-span-3"
          />
          <input
            value={filterLocation}
            onChange={(event) => setFilterLocation(event.target.value)}
            placeholder="Filter by location"
            aria-label="Filter by location"
            className="surface-subtle w-full px-3 py-2 text-sm"
          />
          <select
            className="surface-subtle w-full px-3 py-2 text-sm"
            value={filterMode}
            aria-label="Filter by work mode"
            onChange={(event) => setFilterMode(event.target.value)}
          >
            <option value="">All modes</option>
            <option value="remote">Remote</option>
            <option value="on-site">On-site</option>
            <option value="hybrid">Hybrid</option>
          </select>
        </div>

        <div className="mt-8">
          {loading && <SkeletonList rows={5} />}
          {!loading && error && (
            <div className="rounded-xl border border-[var(--ds-danger)]/40 bg-[var(--ds-danger-bg)] px-4 py-3 text-sm text-[var(--ds-danger)]">
              {error}
            </div>
          )}

          {!loading && !error && internships.length === 0 && (
            <EmptyState presetKey="internships" title="No Internships Posted Yet" description="New postings will show up here as soon as they go live." size="sm" />
          )}

          {!loading && !error && internships.length > 0 && filtered.length === 0 && (
            <EmptyState presetKey="search" title="No Results Found" description="Try a different keyword, location, or mode filter." size="sm" />
          )}

          {!loading && !error && filtered.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((item) => (
                <Link key={item._id} href={`/internships/${item._id}`} className={card}>
                  <p className="text-base font-semibold">{item.role}</p>
                  <p className="mt-1 text-sm text-[var(--ds-muted)]">{item.company?.companyName || "Company"}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--ds-muted)]">
                    {item.location && (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                        {item.location}
                      </span>
                    )}
                    {item.mode && <span className="capitalize">{item.mode}</span>}
                    {item.stipend && <span>{item.stipend}</span>}
                  </div>
                  {(item.skillsRequired || []).length > 0 && (
                    <p className="mt-3 line-clamp-1 text-xs text-[var(--ds-text-secondary)]">
                      {item.skillsRequired?.slice(0, 4).join(" · ")}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </main>
  );
}
