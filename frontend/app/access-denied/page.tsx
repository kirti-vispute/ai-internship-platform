"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { clearAuthSession, getAuthSession } from "@/lib/session";
import { getAuthPathForRole, getDashboardPathForRole } from "@/lib/auth-routes";

export default function AccessDeniedPage() {
  const router = useRouter();
  const session = getAuthSession();

  const dashboardHref = session.role ? getDashboardPathForRole(session.role) : "/";
  const loginHref = session.role ? getAuthPathForRole(session.role) : "/auth/intern";

  return (
    <main>
      <Navbar />
      <section className="container-shell py-16 sm:py-24">
        <div className="mx-auto max-w-lg rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-soft dark:border-slate-700 dark:bg-slate-900">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary-600 dark:text-primary-300">Access denied</p>
          <h1 className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">You don&apos;t have permission to view this page</h1>
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
            Sign in with the correct account or return to your dashboard.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            {session.loggedIn && session.role ? (
              <Button href={dashboardHref}>Go to my dashboard</Button>
            ) : (
              <Button href={loginHref}>Sign in</Button>
            )}
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                clearAuthSession();
                router.push("/");
              }}
            >
              Sign out &amp; go home
            </Button>
          </div>
          <p className="mt-6 text-xs text-slate-500 dark:text-slate-400">
            <Link href="/" className="font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-300">
              Back to homepage
            </Link>
          </p>
        </div>
      </section>
      <Footer />
    </main>
  );
}
