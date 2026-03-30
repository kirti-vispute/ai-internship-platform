"use client";
import { useRouter } from "next/navigation";
import { RoleDashboardGuard } from "@/components/ui/role-dashboard-guard";
import { InternShell } from "@/components/dashboard/intern-shell";
import { SectionPanel } from "@/components/dashboard/section-panel";
import { clearAuthSession } from "@/lib/session";

export default function MockAptitudePage() {
  const router = useRouter();
  const handleLogout = () => {
    clearAuthSession();
    router.push("/auth/intern");
  };

  return (
    <RoleDashboardGuard expectedRole="intern">
      <InternShell welcomeName="Intern" onLogout={handleLogout}>
        <SectionPanel title="Mock Aptitude Test" subtitle="Practice quantitative and logical reasoning.">
          <p className="text-sm text-slate-600">Aptitude test integration can be attached here.</p>
        </SectionPanel>
      </InternShell>
    </RoleDashboardGuard>
  );
}

