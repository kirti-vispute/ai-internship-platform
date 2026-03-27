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

  const parsed = profile?.resume?.parsed;
  const projectList = parsed?.projects || [];
  const educationList = parsed?.education || [];
  const certificationList = parsed?.certifications || [];
  const achievementList = parsed?.achievements || profile?.achievements || [];
  const languages = parsed?.languages || [];
  const initials = (profile?.fullName || "I")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

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
                <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-5 shadow-sm">
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-lg font-semibold text-white">
                      {initials || "I"}
                    </div>
                    <div className="min-w-[220px] flex-1">
                      <p className="text-lg font-semibold text-slate-900">{profile?.fullName || "Intern"}</p>
                      <p className="mt-0.5 text-sm text-slate-600">{profile?.email || "-"}</p>
                      <p className="text-sm text-slate-600">{profile?.mobile || "-"}</p>
                      {parsed?.location && <p className="text-sm text-slate-600">{parsed.location}</p>}
                    </div>
                  </div>
                  <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
                      <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Education</p>
                      <p className="mt-1 text-base font-semibold text-slate-900">{educationList.length}</p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
                      <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Courses</p>
                      <p className="mt-1 text-base font-semibold text-slate-900">{(profile?.completedCourses || []).length}</p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
                      <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Projects</p>
                      <p className="mt-1 text-base font-semibold text-slate-900">{projectList.length}</p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
                      <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Certifications</p>
                      <p className="mt-1 text-base font-semibold text-slate-900">{certificationList.length}</p>
                    </div>
                  </div>
                </div>
              )}
            </SectionPanel>

            <SectionPanel title="Skills" subtitle="Extracted and normalized skills from your resume.">
              <SkillChips skills={parsed?.skills || profile?.skills || []} />
            </SectionPanel>

            <div className="grid gap-6 xl:grid-cols-3">
              <SectionPanel title="Projects" subtitle="Resume project highlights.">
                {projectList.length === 0 ? (
                  <p className="text-sm text-slate-500">No projects extracted yet.</p>
                ) : (
                  <div className="space-y-2">
                    {projectList.slice(0, 6).map((project, idx) => (
                      <div key={`${project.title || "project"}-${idx}`} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                        <p className="text-sm font-semibold text-slate-900">{project.title || "Project"}</p>
                        {project.techStack && project.techStack.length > 0 && (
                          <div className="mt-2">
                            <SkillChips skills={project.techStack} />
                          </div>
                        )}
                        {project.description && <p className="mt-2 text-xs text-slate-600">{project.description}</p>}
                        {project.demoLink && (
                          <a href={project.demoLink} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs font-medium text-blue-700 hover:underline">
                            View demo
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </SectionPanel>

              <SectionPanel title="Education" subtitle="Extracted academic details.">
                {educationList.length === 0 ? (
                  <p className="text-sm text-slate-500">No education entries extracted yet.</p>
                ) : (
                  <div className="space-y-2">
                    {educationList.slice(0, 6).map((item, idx) => (
                      <div key={`${item.degree || "education"}-${idx}`} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                        <p className="text-sm font-semibold text-slate-900">{item.degree || "Education"}</p>
                        <p className="text-xs text-slate-600">{item.institution || item.raw || "-"}</p>
                        {(item.startYear || item.endYear) && (
                          <p className="mt-1 text-xs text-slate-500">{[item.startYear, item.endYear].filter(Boolean).join(" - ")}</p>
                        )}
                        {item.grade && <p className="mt-1 text-xs text-slate-500">Grade: {item.grade}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </SectionPanel>

              <SectionPanel title="Certifications" subtitle="Extracted certification records.">
                {certificationList.length === 0 ? (
                  <p className="text-sm text-slate-500">No certifications extracted yet.</p>
                ) : (
                  <div className="space-y-2">
                    {certificationList.slice(0, 6).map((item, idx) => (
                      <div key={`${item.name || "cert"}-${idx}`} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                        <p className="text-sm font-semibold text-slate-900">{item.name || item.raw || "Certification"}</p>
                        {(item.issuer || item.year) && (
                          <p className="text-xs text-slate-500">{[item.issuer, item.year].filter(Boolean).join(" | ")}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </SectionPanel>
            </div>

            <SectionPanel title="Achievements" subtitle="Awards and notable accomplishments.">
              {achievementList.length === 0 ? (
                <p className="text-sm text-slate-500">No achievements extracted yet.</p>
              ) : (
                <ul className="grid gap-2 md:grid-cols-2">
                  {achievementList.slice(0, 10).map((item, idx) => (
                    <li key={`ach-${idx}`} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                      {item}
                    </li>
                  ))}
                </ul>
              )}
            </SectionPanel>

            {languages.length > 0 && (
              <SectionPanel title="Languages" subtitle="Detected from additional information.">
                <SkillChips skills={languages} />
              </SectionPanel>
            )}
          </div>
        )}
      </InternShell>
    </RoleDashboardGuard>
  );
}
