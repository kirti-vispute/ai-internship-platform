"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RoleDashboardGuard } from "@/components/ui/role-dashboard-guard";
import { InternShell } from "@/components/dashboard/intern-shell";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { MockAptitudeHub } from "@/components/dashboard/mock-aptitude-hub";
import { SectionPanel } from "@/components/dashboard/section-panel";
import { clearAuthSession } from "@/lib/session";
import { InternProfile, fetchInternProfile } from "@/lib/intern-portal";

export default function MockAptitudePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<InternProfile | null>(null);

  useEffect(() => {
    fetchInternProfile().then(setProfile).catch(() => undefined);
  }, []);

  const handleLogout = () => {
    clearAuthSession();
    router.push("/auth/intern");
  };

  return (
    <RoleDashboardGuard expectedRole="intern">
      <InternShell welcomeName={profile?.fullName} onLogout={handleLogout}>
        <div className="dashboard-stack">
          <DashboardPageHeader
            eyebrow="Learning"
            title="Mock Aptitude Test"
            subtitle="AMCAT-style timed practice with scoring, mentor feedback, and progress tracking."
          />
          <SectionPanel title="Aptitude Test Engine">
            <MockAptitudeHub />
          </SectionPanel>
        </div>
      </InternShell>
    </RoleDashboardGuard>
  );
}
