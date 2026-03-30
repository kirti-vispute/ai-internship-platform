"use client";

import { useRouter } from "next/navigation";
import { RoleDashboardGuard } from "@/components/ui/role-dashboard-guard";
import { InternShell } from "@/components/dashboard/intern-shell";
import { SectionPanel } from "@/components/dashboard/section-panel";
import { clearAuthSession } from "@/lib/session";

export default function SavedInternshipsPage() {
  const router = useRouter();

  function handleLogout() {
    clearAuthSession();
    router.push("/auth/intern");
  }

  return (
    <RoleDashboardGuard expectedRole="intern">
      <InternShell welcomeName="Intern" onLogout={handleLogout}>
        <SectionPanel title="Saved Internships" subtitle="Manage internships you bookmarked for later.">
          <p className="text-sm text-slate-600">Saved internships feature can be connected to backend persistence here.</p>
        </SectionPanel>
      </InternShell>
    </RoleDashboardGuard>
  );
}

