"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAuthSession, type AuthRole } from "@/lib/session";

type RoleDashboardGuardProps = {
  expectedRole: AuthRole;
  children: React.ReactNode;
};

export function RoleDashboardGuard({ expectedRole, children }: RoleDashboardGuardProps) {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const session = getAuthSession();

    if (!session.loggedIn || !session.token || session.role !== expectedRole) {
      router.replace(`/auth?role=${expectedRole}`);
      return;
    }

    setAllowed(true);
  }, [expectedRole, router]);

  if (!allowed) {
    return (
      <section className="container-shell py-12">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-soft">
          Checking session...
        </div>
      </section>
    );
  }

  return <>{children}</>;
}
