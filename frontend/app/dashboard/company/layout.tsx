"use client";

import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CompanyShell } from "@/components/dashboard/company-shell";
import { RoleDashboardGuard } from "@/components/ui/role-dashboard-guard";
import {
  fetchCompanyProfile,
  peekCompanyProfile,
  prefetchCompanyDashboardData,
  type CompanyCurrentUser
} from "@/lib/company-portal";
import { logoutAuthSession } from "@/lib/api-client";

export default function CompanyDashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  // Must stay undefined on the first render so SSR and client hydration match.
  const [welcomeName, setWelcomeName] = useState<string | undefined>(undefined);
  const [currentUser, setCurrentUser] = useState<CompanyCurrentUser | null>(null);

  useLayoutEffect(() => {
    const cached = peekCompanyProfile();
    if (cached) {
      setWelcomeName(cached.profile?.companyName);
      setCurrentUser(cached.currentUser);
    }
  }, []);

  useEffect(() => {
    prefetchCompanyDashboardData();

    let cancelled = false;
    fetchCompanyProfile()
      .then((companyContext) => {
        if (!cancelled) {
          setWelcomeName(companyContext.profile?.companyName);
          setCurrentUser(companyContext.currentUser);
        }
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, []);

  const handleLogout = useCallback(async () => {
    await logoutAuthSession();
    router.push("/auth/company");
  }, [router]);

  return (
    <RoleDashboardGuard expectedRole="company">
      <CompanyShell
        welcomeName={welcomeName}
        companyAccountType={currentUser?.companyAccountType}
        permissions={currentUser?.permissions || []}
        onLogout={handleLogout}
      >
        {children}
      </CompanyShell>
    </RoleDashboardGuard>
  );
}
