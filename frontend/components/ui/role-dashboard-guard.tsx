"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAuthSession, type AuthRole } from "@/lib/session";

type RoleDashboardGuardProps = {
  expectedRole: AuthRole;
  children: React.ReactNode;
};

function isSessionAllowed(expectedRole: AuthRole) {
  const session = getAuthSession();
  return Boolean(session.loggedIn && session.token && session.role === expectedRole);
}

export function RoleDashboardGuard({ expectedRole, children }: RoleDashboardGuardProps) {
  const router = useRouter();
  const [allowed, setAllowed] = useState(() => isSessionAllowed(expectedRole));

  useEffect(() => {
    if (isSessionAllowed(expectedRole)) {
      setAllowed(true);
      return;
    }

    router.replace(`/auth/${expectedRole}`);
  }, [expectedRole, router]);

  if (!allowed) {
    return (
      <section className="container-shell py-12">
        <div className="surface-card p-6 text-sm text-slate-400 shadow-soft">Checking session...</div>
      </section>
    );
  }

  return <>{children}</>;
}
