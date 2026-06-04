"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RoleDashboardGuard } from "@/components/ui/role-dashboard-guard";
import { InternShell } from "@/components/dashboard/intern-shell";
import { LearningAssessmentPanel } from "@/components/dashboard/learning-assessment-panel";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { clearAuthSession } from "@/lib/session";
import { InternProfile, fetchInternProfile } from "@/lib/intern-portal";

export default function MockInterviewPage() {
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
          <DashboardPageHeader eyebrow="Learning" title="Mock Interview" subtitle="Simulated HR and technical interview practice." />
          <LearningAssessmentPanel
            title="Interview Simulations"
            subtitle="Structured mock interviews will be scheduled here."
            emptyTitle="No interview simulations available yet"
            emptyHint="Use HR feedback and skill-gap insights to prepare while simulations are enabled."
            practiceAreas={["Behavioral questions", "Role-fit scenarios", "Technical Q&A", "Communication & clarity"]}
          />
        </div>
      </InternShell>
    </RoleDashboardGuard>
  );
}
