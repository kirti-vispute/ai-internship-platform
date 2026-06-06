"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RoleDashboardGuard } from "@/components/ui/role-dashboard-guard";
import { CompanyShell } from "@/components/dashboard/company-shell";
import { ChatWorkspace } from "@/components/dashboard/chat-workspace";
import { logoutAuthSession } from "@/lib/api-client";
import { fetchCompanyProfile, type CompanyCurrentUser, type CompanyProfile } from "@/lib/company-portal";

export default function CompanyChatPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [currentUser, setCurrentUser] = useState<CompanyCurrentUser | null>(null);

  useEffect(() => {
    fetchCompanyProfile()
      .then((payload) => {
        setProfile(payload.profile);
        setCurrentUser(payload.currentUser);
      })
      .catch(() => {
        setProfile(null);
        setCurrentUser(null);
      });
  }, []);

  async function handleLogout() {
    await logoutAuthSession();
    router.push("/auth/company");
  }

  return (
    <RoleDashboardGuard expectedRole="company">
      <CompanyShell
        welcomeName={profile?.companyName}
        companyAccountType={currentUser?.companyAccountType}
        permissions={currentUser?.permissions}
        onLogout={handleLogout}
      >
        <Suspense fallback={<div className="surface-muted p-4 text-sm text-slate-700 dark:text-slate-300">Loading chat...</div>}>
          <ChatWorkspace role="company" />
        </Suspense>
      </CompanyShell>
    </RoleDashboardGuard>
  );
}
