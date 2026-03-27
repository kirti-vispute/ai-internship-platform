"use client";
import { useRouter } from "next/navigation";
import { RoleDashboardGuard } from "@/components/ui/role-dashboard-guard";
import { InternShell } from "@/components/dashboard/intern-shell";
import { SectionPanel } from "@/components/dashboard/section-panel";
import { clearAuthSession } from "@/lib/session";

export default function LearningCoursesPage() {
  const router = useRouter();
  const handleLogout = () => {
    clearAuthSession();
    router.push("/auth?role=intern");
  };
  return (
    <RoleDashboardGuard expectedRole="intern">
      <InternShell welcomeName="Intern" onLogout={handleLogout}>
        <SectionPanel title="Courses" subtitle="Curated learning tracks for internship readiness.">
          <p className="text-sm text-slate-600">Course integrations can be connected here.</p>
        </SectionPanel>
      </InternShell>
    </RoleDashboardGuard>
  );
}
