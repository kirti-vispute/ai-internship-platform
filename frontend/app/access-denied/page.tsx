"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PlatformLayout } from "@/components/layout/platform-layout";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { logoutAuthSession } from "@/lib/api-client";
import { getAuthSession } from "@/lib/session";
import { getAuthPathForRole, getDashboardPathForRole } from "@/lib/auth-routes";

export default function AccessDeniedPage() {
  const router = useRouter();
  const [loggedIn, setLoggedIn] = useState(false);
  const [role, setRole] = useState<ReturnType<typeof getAuthSession>["role"]>(null);

  useEffect(() => {
    const session = getAuthSession();
    setLoggedIn(session.loggedIn);
    setRole(session.role);
  }, []);

  const dashboardHref = role ? getDashboardPathForRole(role) : "/";
  const loginHref = role ? getAuthPathForRole(role) : "/auth/intern";

  return (
    <PlatformLayout>
      <main className="min-h-screen">
        <Navbar theme="dark" />
        <section className="container-shell ds-page-section">
          <div className="ds-card ds-animate-in mx-auto max-w-lg p-8 text-center">
            <p className="ds-label">Access denied</p>
            <h1 className="ds-h1 mt-2">You don&apos;t have permission to view this page</h1>
            <p className="ds-caption mt-3">Sign in with the correct account or return to your dashboard.</p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              {loggedIn && role ? (
                <Button href={dashboardHref}>Go to my dashboard</Button>
              ) : (
                <Button href={loginHref}>Sign in</Button>
              )}
              <Button
                type="button"
                variant="secondary"
                onClick={async () => {
                  await logoutAuthSession();
                  router.push("/");
                }}
              >
                Sign out &amp; go home
              </Button>
            </div>
            <p className="ds-caption mt-6">
              <Link href="/" className="font-semibold text-[var(--ds-accent)] hover:text-[var(--ds-text)]">
                Back to homepage
              </Link>
            </p>
          </div>
        </section>
        <Footer theme="dark" />
      </main>
    </PlatformLayout>
  );
}
