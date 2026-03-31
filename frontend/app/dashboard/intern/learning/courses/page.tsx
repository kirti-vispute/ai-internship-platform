"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RoleDashboardGuard } from "@/components/ui/role-dashboard-guard";
import { InternShell } from "@/components/dashboard/intern-shell";
import { SectionPanel } from "@/components/dashboard/section-panel";
import { clearAuthSession } from "@/lib/session";
import { InternProfile, fetchInternProfile } from "@/lib/intern-portal";

export default function LearningCoursesPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<InternProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInternProfile()
      .then((data) => setProfile(data))
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = () => {
    clearAuthSession();
    router.push("/auth/intern");
  };

  const courses = profile?.completedCourses || [];

  return (
    <RoleDashboardGuard expectedRole="intern">
      <InternShell welcomeName={profile?.fullName} onLogout={handleLogout}>
        <SectionPanel title="Courses" subtitle="Your tracked course completions from profile data.">
          {loading ? (
            <div className="surface-muted px-4 py-3 text-sm text-slate-700 dark:text-slate-300">Loading courses...</div>
          ) : courses.length === 0 ? (
            <div className="surface-subtle px-4 py-3 text-sm text-slate-700 dark:text-slate-300">No courses added yet.</div>
          ) : (
            <ul className="space-y-2">
              {courses.map((course) => (
                <li key={course} className="surface-subtle px-3 py-2 text-sm text-slate-700 dark:text-slate-300">
                  {course}
                </li>
              ))}
            </ul>
          )}
        </SectionPanel>
      </InternShell>
    </RoleDashboardGuard>
  );
}
