"use client";
import { useRouter } from "next/navigation";
import { RoleDashboardGuard } from "@/components/ui/role-dashboard-guard";
import { InternShell } from "@/components/dashboard/intern-shell";
import { SectionPanel } from "@/components/dashboard/section-panel";
import { clearAuthSession } from "@/lib/session";

export default function LearningCertificationsPage() {
  const router = useRouter();
  const handleLogout = () => {
    clearAuthSession();
    router.push("/auth/intern");
  };

  return (
    <RoleDashboardGuard expectedRole="intern">
      <InternShell welcomeName="Intern" onLogout={handleLogout}>
        <SectionPanel title="Certifications" subtitle="Certification planning and tracking.">
          <p className="text-sm text-slate-600">Certification modules can be integrated here.</p>
        </SectionPanel>
      </InternShell>
    </RoleDashboardGuard>
  );
}
