"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { buildAuthRedirectUrl, getAuthPathForRole, getDashboardPathForRole, isInterviewPath } from "@/lib/auth-routes";
import { getAuthSession, type AuthRole } from "@/lib/session";

type InterviewRoomGuardProps = {
  children: React.ReactNode;
};

const ALLOWED_ROLES: AuthRole[] = ["intern", "company"];

export function InterviewRoomGuard({ children }: InterviewRoomGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [allowed, setAllowed] = useState(false);
  const [statusMessage, setStatusMessage] = useState("Checking session...");

  useEffect(() => {
    const session = getAuthSession();

    if (!session.loggedIn || !session.token || !session.role) {
      setStatusMessage("Redirecting to sign in...");
      const redirectRole = session.role && ALLOWED_ROLES.includes(session.role) ? session.role : "intern";
      router.replace(buildAuthRedirectUrl(redirectRole, pathname));
      return;
    }

    if (!ALLOWED_ROLES.includes(session.role)) {
      setStatusMessage("Access denied. Redirecting...");
      router.replace(getDashboardPathForRole(session.role));
      return;
    }

    if (!isInterviewPath(pathname)) {
      router.replace(getDashboardPathForRole(session.role));
      return;
    }

    setAllowed(true);
  }, [pathname, router]);

  if (!allowed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-sm text-slate-300">
        {statusMessage}
      </div>
    );
  }

  return <>{children}</>;
}

export function resolveInterviewAuthRedirect(role: AuthRole | null, returnPath: string): string {
  const safeRole = role && ALLOWED_ROLES.includes(role) ? role : "intern";
  return buildAuthRedirectUrl(safeRole, returnPath);
}

export function getInterviewAuthPath(role: AuthRole | null): string {
  const safeRole = role && ALLOWED_ROLES.includes(role) ? role : "intern";
  return getAuthPathForRole(safeRole);
}
