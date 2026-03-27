"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RoleDashboardGuard } from "@/components/ui/role-dashboard-guard";
import { InternShell } from "@/components/dashboard/intern-shell";
import { SectionPanel } from "@/components/dashboard/section-panel";
import { clearAuthSession } from "@/lib/session";
import { InternProfile, fetchInternProfile } from "@/lib/intern-portal";

export default function InternProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<InternProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError(null);
        setProfile(await fetchInternProfile());
      } catch (err) {
        setError((err as Error).message || "Failed to load profile.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  function handleLogout() {
    clearAuthSession();
    router.push("/auth?role=intern");
  }

  return (
    <RoleDashboardGuard expectedRole="intern">
      <InternShell welcomeName={profile?.fullName} onLogout={handleLogout}>
        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600">Loading profile...</div>
        ) : (
          <SectionPanel title="Profile" subtitle="Your account and profile data">
            {error ? (
              <p className="text-sm text-rose-700">{error}</p>
            ) : (
              <div className="grid gap-3 text-sm sm:grid-cols-2">
                <p className="text-slate-700">Full Name: <span className="font-semibold">{profile?.fullName || "-"}</span></p>
                <p className="text-slate-700">Email: <span className="font-semibold">{profile?.email || "-"}</span></p>
                <p className="text-slate-700">Mobile: <span className="font-semibold">{profile?.mobile || "-"}</span></p>
                <p className="text-slate-700">Skills: <span className="font-semibold">{(profile?.skills || []).join(", ") || "-"}</span></p>
                <p className="text-slate-700">Education entries: <span className="font-semibold">{(profile?.education || []).length}</span></p>
                <p className="text-slate-700">Completed courses: <span className="font-semibold">{(profile?.completedCourses || []).length}</span></p>
              </div>
            )}
          </SectionPanel>
        )}
      </InternShell>
    </RoleDashboardGuard>
  );
}
