"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RoleDashboardGuard } from "@/components/ui/role-dashboard-guard";
import { InternShell } from "@/components/dashboard/intern-shell";
import { InternResumePanel } from "@/components/dashboard/intern-resume-panel";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { clearAuthSession } from "@/lib/session";
import { InternProfile, fetchInternProfile } from "@/lib/intern-portal";

export default function InternResumePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<InternProfile | null>(null);

  useEffect(() => {
    fetchInternProfile().then(setProfile).catch(() => undefined);
  }, []);

  function handleLogout() {
    clearAuthSession();
    router.push("/auth/intern");
  }

  return (
    <RoleDashboardGuard expectedRole="intern">
      <InternShell welcomeName={profile?.fullName} onLogout={handleLogout}>
        <div className="dashboard-stack">
          <DashboardPageHeader eyebrow="My Profile" title="Resume" subtitle="Upload, preview, and review parsed resume data." />
          <InternResumePanel />
        </div>
      </InternShell>
    </RoleDashboardGuard>
  );
}
