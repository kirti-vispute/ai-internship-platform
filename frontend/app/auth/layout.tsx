"use client";

import { Suspense } from "react";
import { AuthSessionRedirect } from "@/components/auth/auth-session-redirect";
import { usePathname } from "next/navigation";
import type { AuthRole } from "@/lib/session";

function AuthLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const role: AuthRole = pathname.includes("/auth/company")
    ? "company"
    : pathname.includes("/auth/admin")
      ? "admin"
      : "intern";

  return <AuthSessionRedirect expectedRole={role}>{children}</AuthSessionRedirect>;
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <section className="container-shell py-12">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-soft dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
            Loading...
          </div>
        </section>
      }
    >
      <AuthLayoutInner>{children}</AuthLayoutInner>
    </Suspense>
  );
}
