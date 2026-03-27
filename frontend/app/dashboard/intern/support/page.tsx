"use client";
import { useRouter } from "next/navigation";
import { RoleDashboardGuard } from "@/components/ui/role-dashboard-guard";
import { InternShell } from "@/components/dashboard/intern-shell";
import { SectionPanel } from "@/components/dashboard/section-panel";
import { clearAuthSession } from "@/lib/session";

export default function SupportPage() {
  const router = useRouter();
  const handleLogout = () => {
    clearAuthSession();
    router.push("/auth?role=intern");
  };

  return (
    <RoleDashboardGuard expectedRole="intern">
      <InternShell welcomeName="Intern" onLogout={handleLogout}>
        <SectionPanel title="Help / Support" subtitle="Get platform help and issue resolution guidance.">
          <ul className="space-y-2 text-sm text-slate-700">
            <li className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">For account/access issues, contact support at support@internai.local.</li>
            <li className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">For internship disputes, use the report company option in company pages.</li>
            <li className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">For resume scoring issues, re-upload resume and refresh score page.</li>
          </ul>
        </SectionPanel>
      </InternShell>
    </RoleDashboardGuard>
  );
}
