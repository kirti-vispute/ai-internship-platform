"use client";

import { useRouter } from "next/navigation";
import { RoleDashboardGuard } from "@/components/ui/role-dashboard-guard";
import { InternShell } from "@/components/dashboard/intern-shell";
import { SectionPanel } from "@/components/dashboard/section-panel";
import { clearAuthSession } from "@/lib/session";

export default function SearchInternshipsPage() {
  const router = useRouter();

  function handleLogout() {
    clearAuthSession();
    router.push("/auth/intern");
  }

  return (
    <RoleDashboardGuard expectedRole="intern">
      <InternShell welcomeName="Intern" onLogout={handleLogout}>
        <SectionPanel title="Search Internships" subtitle="Use filters to discover relevant internships.">
          <p className="text-sm text-slate-600">Search API integration can be connected here. This page is now a dedicated route in the portal navigation.</p>
        </SectionPanel>
      </InternShell>
    </RoleDashboardGuard>
  );
}

