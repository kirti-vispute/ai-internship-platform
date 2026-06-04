"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  buildAuthRedirectUrl,
  getDashboardPathForRole,
  isPathAllowedForRole
} from "@/lib/auth-routes";
import { getAuthSession, type AuthRole } from "@/lib/session";

type RoleDashboardGuardProps = {
  expectedRole: AuthRole;
  children: React.ReactNode;
};

export function RoleDashboardGuard({ expectedRole, children }: RoleDashboardGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [allowed, setAllowed] = useState(false);
  const [statusMessage, setStatusMessage] = useState("Checking session...");

  useEffect(() => {
    const session = getAuthSession();

    if (!session.loggedIn || !session.token) {
      setStatusMessage("Redirecting to sign in...");
      router.replace(buildAuthRedirectUrl(expectedRole, pathname));
      return;
    }

    if (!session.role) {
      setStatusMessage("Redirecting to sign in...");
      router.replace(buildAuthRedirectUrl(expectedRole, pathname));
      return;
    }

    if (session.role !== expectedRole) {
      if (expectedRole === "admin") {
        setStatusMessage("Access denied. Redirecting...");
        router.replace(session.loggedIn ? "/access-denied" : buildAuthRedirectUrl("admin", pathname));
        return;
      }
      setStatusMessage("Redirecting to your dashboard...");
      router.replace(getDashboardPathForRole(session.role));
      return;
    }

    if (!isPathAllowedForRole(pathname, expectedRole)) {
      router.replace(getDashboardPathForRole(expectedRole));
      return;
    }

    setAllowed(true);
  }, [expectedRole, pathname, router]);

  if (!allowed) {
    return (
      <section className="container-shell py-12">
        <div className="animate-reveal rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-soft dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
          {statusMessage}
        </div>
      </section>
    );
  }

  return <>{children}</>;
}
