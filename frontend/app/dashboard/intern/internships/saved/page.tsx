"use client";

import { useRouter } from "next/navigation";
import { RoleDashboardGuard } from "@/components/ui/role-dashboard-guard";
import { InternShell } from "@/components/dashboard/intern-shell";
import { SectionPanel } from "@/components/dashboard/section-panel";
import { Button } from "@/components/ui/button";
import { clearAuthSession } from "@/lib/session";
import { useEffect, useState } from "react";
import { InternProfile, fetchInternProfile } from "@/lib/intern-portal";

export default function SavedInternshipsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<InternProfile | null>(null);

  useEffect(() => {
    fetchInternProfile().then(setProfile).catch(() => undefined);
  }, []);

  function handleLogout() {
    clearAuthSession();
    router.push("/auth/intern");
  }

  return (
    <RoleDashboardGuard expectedRole="intern">
      <InternShell welcomeName={profile?.fullName} onLogout={handleLogout}>
        <SectionPanel title="Saved Internships" subtitle="Track opportunities you want to revisit.">
          <div className="surface-subtle flex flex-col gap-3 px-4 py-4 text-sm text-slate-700 dark:text-slate-300">
            <p>No saved internships yet.</p>
            <div>
              <Button type="button" size="sm" variant="secondary" onClick={() => router.push("/dashboard/intern/internships/search")}>
                Browse Internships
              </Button>
            </div>
          </div>
        </SectionPanel>
      </InternShell>
    </RoleDashboardGuard>
  );
}
