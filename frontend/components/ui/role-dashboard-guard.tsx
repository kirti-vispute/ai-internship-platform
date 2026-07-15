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
      <section className="container-shell ds-page-section">
        <div className="ds-card ds-animate-in p-6 text-sm text-[var(--ds-muted)]">{statusMessage}</div>
      </section>
    );
  }

  return <>{children}</>;
}
