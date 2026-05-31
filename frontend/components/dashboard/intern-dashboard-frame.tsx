"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { InternShell } from "@/components/dashboard/intern-shell";
import { RoleDashboardGuard } from "@/components/ui/role-dashboard-guard";
import { clearAuthSession } from "@/lib/session";
import { fetchInternProfile, peekInternProfile } from "@/lib/intern-portal";

export function InternDashboardFrame({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [welcomeName, setWelcomeName] = useState<string | undefined>(() => peekInternProfile()?.fullName);

  useEffect(() => {
    let active = true;
    fetchInternProfile()
      .then((profile) => {
        if (active) setWelcomeName(profile?.fullName || undefined);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  function handleLogout() {
    clearAuthSession();
    router.push("/auth/intern");
  }

  return (
    <RoleDashboardGuard expectedRole="intern">
      <InternShell welcomeName={welcomeName} onLogout={handleLogout}>
        {children}
      </InternShell>
    </RoleDashboardGuard>
  );
}
