"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RoleDashboardGuard } from "@/components/ui/role-dashboard-guard";
import { InternShell } from "@/components/dashboard/intern-shell";
import { SectionPanel } from "@/components/dashboard/section-panel";
import { CertificationsModule } from "@/components/dashboard/certifications-module";
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

  return (
    <RoleDashboardGuard expectedRole="intern">
      <InternShell welcomeName={profile?.fullName} onLogout={handleLogout}>
        <SectionPanel
          title="Certifications"
          subtitle="Upload course completion proof. Only admin-approved certifications become Verified."
        >
          {loading ? (
            <div className="surface-muted px-4 py-3 text-sm text-slate-700 dark:text-slate-300">Loading...</div>
          ) : (
            <CertificationsModule />
          )}
        </SectionPanel>
      </InternShell>
    </RoleDashboardGuard>
  );
}
