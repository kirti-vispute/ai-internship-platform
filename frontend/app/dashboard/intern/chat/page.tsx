"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RoleDashboardGuard } from "@/components/ui/role-dashboard-guard";
import { InternShell } from "@/components/dashboard/intern-shell";
import { ChatWorkspace } from "@/components/dashboard/chat-workspace";
import { clearAuthSession } from "@/lib/session";
import { fetchInternProfile, type InternProfile } from "@/lib/intern-portal";

export default function InternChatPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<InternProfile | null>(null);

  useEffect(() => {
    fetchInternProfile()
      .then(setProfile)
      .catch(() => setProfile(null));
  }, []);

  function handleLogout() {
    clearAuthSession();
    router.push("/auth/intern");
  }

  return (
    <RoleDashboardGuard expectedRole="intern">
      <InternShell welcomeName={profile?.fullName} onLogout={handleLogout}>
        <Suspense fallback={<div className="surface-muted p-4 text-sm text-slate-700 dark:text-slate-300">Loading chat...</div>}>
          <ChatWorkspace role="intern" />
        </Suspense>
      </InternShell>
    </RoleDashboardGuard>
  );
}
