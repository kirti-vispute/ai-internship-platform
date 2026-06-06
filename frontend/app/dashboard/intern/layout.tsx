"use client";

import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { InternShell } from "@/components/dashboard/intern-shell";
import { RoleDashboardGuard } from "@/components/ui/role-dashboard-guard";
import { scheduleInitialInternPrefetch } from "@/lib/intern-route-prefetch-scheduler";
import { fetchInternProfile, peekInternProfile, prefetchInternDashboardData, checkInterviewReminders } from "@/lib/intern-portal";
import { logoutAuthSession } from "@/lib/api-client";
import { getAuthSession } from "@/lib/session";

export default function InternDashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  // Must stay undefined on the first render so SSR and client hydration match.
  // Session/profile data lives in localStorage and is read after mount.
  const [welcomeName, setWelcomeName] = useState<string | undefined>(undefined);

  useLayoutEffect(() => {
    const cached = peekInternProfile();
    if (cached?.fullName) {
      setWelcomeName(cached.fullName);
      return;
    }
    const email = getAuthSession().email;
    if (email) setWelcomeName(email.split("@")[0]);
  }, []);

  useEffect(() => {
    prefetchInternDashboardData();
    scheduleInitialInternPrefetch(router);
    checkInterviewReminders().catch(() => undefined);

    let cancelled = false;
    fetchInternProfile()
      .then((profile) => {
        if (!cancelled && profile.fullName) setWelcomeName(profile.fullName);
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [router]);

  const handleLogout = useCallback(async () => {
    await logoutAuthSession();
    router.push("/auth/intern");
  }, [router]);

  return (
    <RoleDashboardGuard expectedRole="intern">
      <InternShell welcomeName={welcomeName} onLogout={handleLogout}>
        {children}
      </InternShell>
    </RoleDashboardGuard>
  );
}
