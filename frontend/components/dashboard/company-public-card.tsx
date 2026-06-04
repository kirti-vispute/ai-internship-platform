"use client";

import { useEffect, useState } from "react";
import { PublicCompanyProfile, fetchPublicCompanyProfile } from "@/lib/intern-portal";
import { ExternalLink } from "@/components/ui/external-link";

type CompanyPublicCardProps = {
  companyId: string;
};

export function CompanyPublicCard({ companyId }: CompanyPublicCardProps) {
  const [profile, setProfile] = useState<PublicCompanyProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchPublicCompanyProfile(companyId)
      .then((data) => {
        if (active) setProfile(data);
      })
      .catch(() => {
        if (active) setProfile(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [companyId]);

  if (loading) {
    return <div className="surface-subtle px-3 py-2 text-xs text-slate-600 dark:text-slate-400">Loading company transparency...</div>;
  }

  if (!profile) return null;

  return (
    <div className="surface-subtle mt-3 grid gap-2 px-3 py-3 text-xs text-slate-700 dark:text-slate-300 sm:grid-cols-2">
      <p>
        <span className="font-semibold text-slate-900 dark:text-slate-100">Joined:</span>{" "}
        {profile.joinedAt ? new Date(profile.joinedAt).toLocaleDateString() : "—"}
      </p>
      <p>
        <span className="font-semibold text-slate-900 dark:text-slate-100">Verified:</span>{" "}
        {profile.isVerified ? "Yes" : "Pending"}
      </p>
      <p>
        <span className="font-semibold text-slate-900 dark:text-slate-100">Active openings:</span> {profile.activeOpenings}
      </p>
      <p>
        <span className="font-semibold text-slate-900 dark:text-slate-100">Interns hired:</span> {profile.totalInternsHired}
      </p>
      <p>
        <span className="font-semibold text-slate-900 dark:text-slate-100">Hiring success rate:</span> {profile.hiringSuccessRate}%
      </p>
      {profile.website && (
        <p className="sm:col-span-2">
          <ExternalLink href={profile.website}>Company website</ExternalLink>
        </p>
      )}
    </div>
  );
}
