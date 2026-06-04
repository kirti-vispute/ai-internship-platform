"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RoleDashboardGuard } from "@/components/ui/role-dashboard-guard";
import { InternShell } from "@/components/dashboard/intern-shell";
import { LearningAssessmentPanel } from "@/components/dashboard/learning-assessment-panel";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
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
          <DashboardPageHeader eyebrow="Learning" title="Mock Aptitude Test" subtitle="Timed practice for quantitative and logical reasoning." />
          <LearningAssessmentPanel
            title="Assigned Tests"
            subtitle="Your recruiter or learning path will assign aptitude rounds here."
            emptyTitle="No aptitude tests assigned yet"
            emptyHint="Check back after your profile is reviewed or when a company assigns a test."
            practiceAreas={["Quantitative aptitude", "Logical reasoning", "Data interpretation", "Verbal ability"]}
          />
        </div>
      </InternShell>
    </RoleDashboardGuard>
  );
}
