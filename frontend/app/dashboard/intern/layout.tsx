"use client";

import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { InternShell } from "@/components/dashboard/intern-shell";
import { RoleDashboardGuard } from "@/components/ui/role-dashboard-guard";
import { scheduleInitialInternPrefetch } from "@/lib/intern-route-prefetch-scheduler";
import {
  fetchInternProfile,
  peekInternProfile,
  prefetchInternDashboardData,
  checkInterviewReminders,
  PROFILE_UPDATED_EVENT
} from "@/lib/intern-portal";
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
    const syncName = (force = false) => {
      fetchInternProfile(force)
        .then((profile) => {
          if (!cancelled) setWelcomeName(profile.fullName || undefined);
        })
        .catch(() => undefined);
    };

    syncName();

    // This layout stays mounted across every /dashboard/intern/* navigation,
    // so a resume upload or profile edit on another route (which calls
    // invalidateInternCache()) would otherwise never reach this already-set
    // welcomeName state. Re-sync whenever the cache is invalidated, and on
    // login/logout so a stale name from a previous account never lingers.
    const onProfileUpdated = () => syncName(true);
    window.addEventListener(PROFILE_UPDATED_EVENT, onProfileUpdated);
    window.addEventListener("internai-auth-change", onProfileUpdated);

    return () => {
      cancelled = true;
      window.removeEventListener(PROFILE_UPDATED_EVENT, onProfileUpdated);
      window.removeEventListener("internai-auth-change", onProfileUpdated);
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
