"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RoleDashboardGuard } from "@/components/ui/role-dashboard-guard";
import { InternShell } from "@/components/dashboard/intern-shell";
import { SectionPanel } from "@/components/dashboard/section-panel";
import { SkillChips } from "@/components/dashboard/skill-chips";
import { Skeleton } from "@/components/ui/skeleton";
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
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="mt-3 h-20 w-full" />
            <Skeleton className="mt-3 h-10 w-56" />
          </div>
        ) : (
          <div className="space-y-6">
            <SectionPanel title="Personal Info" subtitle="Core profile details from your account.">
              {error ? (
                <p className="text-sm text-rose-700">{error}</p>
              ) : (
                <div className="grid gap-3 text-sm sm:grid-cols-2">
                  <p className="text-slate-700">Full Name: <span className="font-semibold">{profile?.fullName || "-"}</span></p>
                  <p className="text-slate-700">Email: <span className="font-semibold">{profile?.email || "-"}</span></p>
                  <p className="text-slate-700">Mobile: <span className="font-semibold">{profile?.mobile || "-"}</span></p>
                  <p className="text-slate-700">Completed courses: <span className="font-semibold">{(profile?.completedCourses || []).length}</span></p>
                </div>
              )}
            </SectionPanel>

            <SectionPanel title="Skills" subtitle="Extracted and normalized skills from your resume.">
              <SkillChips skills={profile?.resume?.parsed?.skills || profile?.skills || []} />
            </SectionPanel>

            <div className="grid gap-6 xl:grid-cols-3">
              <SectionPanel title="Projects" subtitle="Resume project highlights.">
                {(profile?.resume?.parsed?.projects || []).length === 0 ? (
                  <p className="text-sm text-slate-500">No projects extracted yet.</p>
                ) : (
                  <div className="space-y-2">
                    {(profile?.resume?.parsed?.projects || []).slice(0, 6).map((project, idx) => (
                      <div key={`${project.title || "project"}-${idx}`} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                        <p className="text-sm font-semibold text-slate-900">{project.title || "Project"}</p>
                        {project.techStack && project.techStack.length > 0 && (
                          <div className="mt-2">
                            <SkillChips skills={project.techStack} />
                          </div>
                        )}
                        {project.description && <p className="mt-2 text-xs text-slate-600">{project.description}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </SectionPanel>

              <SectionPanel title="Education" subtitle="Extracted academic details.">
                {(profile?.resume?.parsed?.education || []).length === 0 ? (
                  <p className="text-sm text-slate-500">No education entries extracted yet.</p>
                ) : (
                  <div className="space-y-2">
                    {(profile?.resume?.parsed?.education || []).slice(0, 6).map((item, idx) => (
                      <div key={`${item.degree || "education"}-${idx}`} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                        <p className="text-sm font-semibold text-slate-900">{item.degree || "Education"}</p>
                        <p className="text-xs text-slate-600">{item.college || item.raw || "-"}</p>
                        {item.year && <p className="mt-1 text-xs text-slate-500">{item.year}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </SectionPanel>

              <SectionPanel title="Certifications" subtitle="Extracted certification records.">
                {(profile?.resume?.parsed?.certifications || []).length === 0 ? (
                  <p className="text-sm text-slate-500">No certifications extracted yet.</p>
                ) : (
                  <div className="space-y-2">
                    {(profile?.resume?.parsed?.certifications || []).slice(0, 6).map((item, idx) => (
                      <div key={`${item.name || "cert"}-${idx}`} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                        <p className="text-sm font-semibold text-slate-900">{item.name || item.raw || "Certification"}</p>
                        {(item.issuer || item.year) && (
                          <p className="text-xs text-slate-500">
                            {[item.issuer, item.year].filter(Boolean).join(" • ")}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </SectionPanel>
            </div>
          </div>
        )}
      </InternShell>
    </RoleDashboardGuard>
  );
}
