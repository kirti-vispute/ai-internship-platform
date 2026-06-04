"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RoleDashboardGuard } from "@/components/ui/role-dashboard-guard";
import { InternShell } from "@/components/dashboard/intern-shell";
import { SectionPanel } from "@/components/dashboard/section-panel";
import { clearAuthSession } from "@/lib/session";
import { InternProfile, fetchInternProfile } from "@/lib/intern-portal";

export default function LearningCertificationsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<InternProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInternProfile()
      .then((data) => setProfile(data))
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = () => {
    clearAuthSession();
    router.push("/auth/intern");
  };

  const certifications = profile?.resume?.parsed?.certifications || [];

  return (
    <RoleDashboardGuard expectedRole="intern">
      <InternShell welcomeName={profile?.fullName} onLogout={handleLogout}>
        <SectionPanel title="Certifications" subtitle="Certification entries extracted from your resume.">
          {loading ? (
            <div className="surface-muted px-4 py-3 text-sm text-slate-700 dark:text-slate-300">Loading certifications...</div>
          ) : certifications.length === 0 ? (
            <div className="surface-subtle px-4 py-3 text-sm text-slate-700 dark:text-slate-300">No certifications extracted yet.</div>
          ) : (
            <ul className="space-y-2">
              {certifications.map((item, index) => (
                <li key={`${item.name || item.raw || "cert"}-${index}`} className="surface-subtle px-3 py-2 text-sm text-slate-700 dark:text-slate-300">
                  <p className="font-semibold text-slate-900 dark:text-slate-100">{item.name || item.raw || "Certification"}</p>
                  {(item.issuer || item.year) && <p className="text-xs text-slate-500 dark:text-slate-400">{[item.issuer, item.year].filter(Boolean).join(" | ")}</p>}
                </li>
              ))}
            </ul>
          )}
        </SectionPanel>
      </InternShell>
    </RoleDashboardGuard>
  );
}
