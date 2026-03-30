"use client";
import { useRouter } from "next/navigation";
import { RoleDashboardGuard } from "@/components/ui/role-dashboard-guard";
import { InternShell } from "@/components/dashboard/intern-shell";
import { SectionPanel } from "@/components/dashboard/section-panel";
import { clearAuthSession } from "@/lib/session";

export default function MockTechnicalPage() {
  const router = useRouter();
  const handleLogout = () => {
    clearAuthSession();
    router.push("/auth/intern");
  };

  return (
    <RoleDashboardGuard expectedRole="intern">
      <InternShell welcomeName="Intern" onLogout={handleLogout}>
        <SectionPanel title="Mock Technical Test" subtitle="Practice core technical problem solving.">
          <p className="text-sm text-slate-600">Technical test modules can be connected here.</p>
        </SectionPanel>
      </InternShell>
    </RoleDashboardGuard>
  );
}

