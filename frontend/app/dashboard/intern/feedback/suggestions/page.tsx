"use client";
import { useRouter } from "next/navigation";
import { RoleDashboardGuard } from "@/components/ui/role-dashboard-guard";
import { InternShell } from "@/components/dashboard/intern-shell";
import { SectionPanel } from "@/components/dashboard/section-panel";
import { clearAuthSession } from "@/lib/session";

export default function SuggestionsPage() {
  const router = useRouter();
  const handleLogout = () => {
    clearAuthSession();
    router.push("/auth/intern");
  };

  return (
    <RoleDashboardGuard expectedRole="intern">
      <InternShell welcomeName="Intern" onLogout={handleLogout}>
        <SectionPanel title="Suggestions" subtitle="Actionable recommendations to improve application outcomes.">
          <ul className="space-y-2 text-sm text-slate-700">
            <li className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">Update skills monthly to improve recommendation quality.</li>
            <li className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">Add quantified achievements in resume projects.</li>
            <li className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">Apply to at least 3 matching internships weekly for better momentum.</li>
          </ul>
        </SectionPanel>
      </InternShell>
    </RoleDashboardGuard>
  );
}

