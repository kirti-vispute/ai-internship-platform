"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RoleDashboardGuard } from "@/components/ui/role-dashboard-guard";
import { InternShell } from "@/components/dashboard/intern-shell";
import { LearningAssessmentPanel } from "@/components/dashboard/learning-assessment-panel";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { clearAuthSession } from "@/lib/session";
import { InternProfile, fetchInternProfile } from "@/lib/intern-portal";

export default function MockTechnicalPage() {
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
          <DashboardPageHeader eyebrow="Learning" title="Mock Technical Test" subtitle="Coding and domain challenges aligned to your target role." />
          <LearningAssessmentPanel
            title="Assigned Challenges"
            subtitle="Technical assessments appear here when assigned by a company or mentor."
            emptyTitle="No technical tests assigned yet"
            emptyHint="Complete your profile and apply to internships to unlock technical rounds."
            practiceAreas={["Data structures & algorithms", "Role-specific coding", "System design basics", "Debugging scenarios"]}
          />
        </div>
      </InternShell>
    </RoleDashboardGuard>
  );
}
