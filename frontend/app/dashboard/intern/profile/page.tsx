"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { RoleDashboardGuard } from "@/components/ui/role-dashboard-guard";
import { InternShell } from "@/components/dashboard/intern-shell";
import { SectionPanel } from "@/components/dashboard/section-panel";
import { SkillChips } from "@/components/dashboard/skill-chips";
import { ExternalLink } from "@/components/ui/external-link";
import { Skeleton } from "@/components/ui/skeleton";
import { clearAuthSession } from "@/lib/session";
import { InternProfile, fetchInternProfile } from "@/lib/intern-portal";
import { SectionTabButton } from "@/components/icons/section-tab-button";
import { PROFILE_TAB_ICONS } from "@/components/icons/section-tab-icons";

type ProfileSectionKey = "overview" | "skills" | "education" | "projects" | "achievements" | "learning";

const PROFILE_SECTIONS: Array<{ key: ProfileSectionKey; label: string }> = [
  { key: "overview", label: "Overview" },
  { key: "skills", label: "Skills" },
  { key: "education", label: "Education" },
  { key: "projects", label: "Projects" },
  { key: "achievements", label: "Achievements" },
  { key: "learning", label: "Learning" }
];

export default function InternProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<InternProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<ProfileSectionKey>("overview");

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
    router.push("/auth/intern");
  }

  const parsed = profile?.resume?.parsed;
  const projectList = parsed?.projects || profile?.profileSections?.projects || [];
  const educationList =
    (profile?.educationDetails || []).length > 0
      ? (profile?.educationDetails || []).map((item) => ({
          degree: item.degree,
          institution: item.college,
          startYear: "",
          endYear: item.passingYear,
          grade: item.cgpa
        }))
      : parsed?.education || [];
  const certificationList =
    (profile?.certificationEntries || []).length > 0
      ? profile?.certificationEntries || []
      : parsed?.certifications || [];
  const courseList = profile?.courseEntries || [];
  const achievementList = parsed?.achievements || profile?.achievements || [];
  const languages = parsed?.languages || [];
  const skillCategories = Array.from(new Set((profile?.skillDetails || []).map((item) => item.category).filter(Boolean) as string[]));
  const technicalSkills = Array.from(new Set((profile?.skills || parsed?.skills || []).map((skill) => String(skill).trim()).filter(Boolean)));
  const skillTags = Array.from(new Set((technicalSkills || []).map((skill) => String(skill).trim()).filter(Boolean))).slice(0, 20);
  const missingSkillHints = useMemo(() => {
    const listed = new Set((parsed?.skills || profile?.skills || []).map((skill) => String(skill).toLowerCase()));
    const commonTargets = ["react", "node.js", "sql", "docker", "communication", "problem solving"];
    return commonTargets.filter((skill) => !listed.has(skill.toLowerCase())).slice(0, 5);
  }, [parsed?.skills, profile?.skills]);
  const initials = (profile?.fullName || "I")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  const learningProgress = useMemo(() => {
    const totalItems = Math.max(1, courseList.length + certificationList.length);
    const completed = (profile?.completedCourses || []).length + certificationList.length;
    return Math.min(100, Math.round((completed / totalItems) * 100));
  }, [courseList.length, certificationList.length, profile?.completedCourses]);

  return (
    <RoleDashboardGuard expectedRole="intern">
      <InternShell welcomeName={profile?.fullName} onLogout={handleLogout}>
        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="mt-3 h-20 w-full" />
            <Skeleton className="mt-3 h-10 w-56" />
          </div>
        ) : (
          <div className="space-y-5">
            {error ? <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}

            <div className="surface-subtle rounded-2xl p-2">
              <div className="flex flex-wrap gap-2">
                {PROFILE_SECTIONS.map((section) => (
                  <SectionTabButton
                    key={section.key}
                    label={section.label}
                    icon={PROFILE_TAB_ICONS[section.key]}
                    active={activeSection === section.key}
                    onClick={() => setActiveSection(section.key)}
                  />
                ))}
              </div>
            </div>

            {activeSection === "overview" && (
              <SectionPanel title="Overview" subtitle="Personal information, professional summary, and social links.">
                <div className="space-y-5">
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Personal Information</p>
                    <div className="surface-muted p-5">
                      <div className="flex flex-wrap items-center gap-4">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-lg font-semibold text-white">{initials || "I"}</div>
                        <div className="min-w-[220px] flex-1">
                          <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">{profile?.fullName || "Intern"}</p>
                          <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-300">{profile?.email || "-"}</p>
                          <p className="text-sm text-slate-600 dark:text-slate-300">{profile?.mobile || "-"}</p>
                          {profile?.address && <p className="text-sm text-slate-600 dark:text-slate-300">{profile.address}</p>}
                          {parsed?.location && <p className="text-sm text-slate-600 dark:text-slate-300">{parsed.location}</p>}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Professional Summary</p>
                    <p className="surface-subtle px-4 py-3 text-sm text-slate-700 dark:text-slate-300">
                      {profile?.summary || parsed?.summary || profile?.bio || "Add a summary to showcase your profile."}
                    </p>
                  </div>

                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Social Links</p>
                    <div className="surface-subtle space-y-2 px-4 py-3 text-sm">
                      {profile?.linkedinUrl ? <ExternalLink href={profile.linkedinUrl} className="text-link-block">LinkedIn</ExternalLink> : null}
                      {profile?.githubUrl ? <ExternalLink href={profile.githubUrl} className="text-link-block">GitHub</ExternalLink> : null}
                      {profile?.portfolioUrl ? <ExternalLink href={profile.portfolioUrl} className="text-link-block">Portfolio</ExternalLink> : null}
                      {(profile?.links || []).slice(0, 5).map((link) => (
                        <ExternalLink key={link} href={link} className="text-link-block max-w-full break-all">
                          {link}
                        </ExternalLink>
                      ))}
                      {!profile?.linkedinUrl && !profile?.githubUrl && !profile?.portfolioUrl && (profile?.links || []).length === 0 ? (
                        <p className="text-slate-600 dark:text-slate-300">No social links added yet.</p>
                      ) : null}
                    </div>
                  </div>
                </div>
              </SectionPanel>
            )}

            {activeSection === "skills" && (
              <SectionPanel title="Skills" subtitle="Technical capabilities, soft skills, categories, and recruiter tags.">
                <div className="space-y-4">
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Technical Skills</p>
                    <SkillChips skills={technicalSkills} variant="elevated" />
                  </div>
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Soft Skills</p>
                    <SkillChips skills={profile?.softSkills || []} variant="elevated" />
                  </div>
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Skill Categories</p>
                    {skillCategories.length > 0 ? <SkillChips skills={skillCategories} variant="elevated" /> : <p className="text-sm text-slate-600 dark:text-slate-300">No skill categories added yet.</p>}
                  </div>
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Skill Tags</p>
                    {skillTags.length > 0 ? <SkillChips skills={skillTags} variant="elevated" /> : <p className="text-sm text-slate-600 dark:text-slate-300">No skill tags available yet.</p>}
                  </div>
                </div>
              </SectionPanel>
            )}

            {activeSection === "education" && (
              <SectionPanel title="Education" subtitle="Academic profile and graduation details.">
                {educationList.length === 0 ? (
                  <p className="text-sm text-slate-600 dark:text-slate-300">No education entries available yet.</p>
                ) : (
                  <div className="space-y-2">
                    {educationList.map((item, idx) => (
                      <div key={`${item.degree || "education"}-${idx}`} className="surface-subtle grid gap-2 p-3.5 text-sm sm:grid-cols-2">
                        <p><span className="font-semibold text-slate-900 dark:text-slate-100">College:</span> {item.institution || "-"}</p>
                        <p><span className="font-semibold text-slate-900 dark:text-slate-100">Degree:</span> {item.degree || "-"}</p>
                        <p><span className="font-semibold text-slate-900 dark:text-slate-100">Branch:</span> {(profile?.educationDetails || [])[idx]?.branch || "-"}</p>
                        <p><span className="font-semibold text-slate-900 dark:text-slate-100">CGPA:</span> {(profile?.educationDetails || [])[idx]?.cgpa || item.grade || "-"}</p>
                        <p className="sm:col-span-2">
                          <span className="font-semibold text-slate-900 dark:text-slate-100">Graduation Details:</span>{" "}
                          {[item.startYear, item.endYear || (profile?.educationDetails || [])[idx]?.passingYear].filter(Boolean).join(" - ") || "-"}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </SectionPanel>
            )}

            {activeSection === "projects" && (
              <SectionPanel title="Projects" subtitle="Project portfolio with technologies and links.">
                {projectList.length === 0 ? (
                  <p className="text-sm text-slate-600 dark:text-slate-300">No projects extracted yet.</p>
                ) : (
                  <div className="space-y-2">
                    {projectList.map((project, idx) => (
                      <div key={`${project.title || "project"}-${idx}`} className="surface-subtle p-3.5">
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{project.title || `Project ${idx + 1}`}</p>
                        {project.description ? <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">{project.description}</p> : null}
                        <div className="mt-2">
                          <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Technologies</p>
                          <SkillChips skills={project.techStack || []} variant="elevated" />
                        </div>
                        <div className="mt-2 space-y-1 text-xs">
                          {project.demoLink ? (
                            <ExternalLink href={project.demoLink} className="text-link-block">
                              Live Demo Link
                            </ExternalLink>
                          ) : null}
                          {project.demoLink ? null : <p className="text-slate-500">No Live Demo link added.</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </SectionPanel>
            )}

            {activeSection === "achievements" && (
              <SectionPanel title="Achievements" subtitle="Awards, recognitions, and accomplishments.">
                {achievementList.length === 0 ? (
                  <p className="text-sm text-slate-600 dark:text-slate-300">No achievements listed yet.</p>
                ) : (
                  <ul className="space-y-2">
                    {achievementList.map((item, idx) => (
                      <li key={`ach-${idx}`} className="surface-subtle px-3 py-2.5 text-sm text-slate-700 dark:text-slate-200">
                        {item}
                      </li>
                    ))}
                  </ul>
                )}
              </SectionPanel>
            )}

            {activeSection === "learning" && (
              <SectionPanel title="Learning" subtitle="Courses, certifications, and profile learning progress.">
                <div className="space-y-4">
                  <div className="surface-subtle px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Learning Progress</p>
                    <p className="mt-1 text-base font-semibold text-slate-900 dark:text-slate-100">{learningProgress}%</p>
                  </div>

                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Courses</p>
                    {courseList.length === 0 && (profile?.completedCourses || []).length === 0 ? (
                      <p className="text-sm text-slate-600 dark:text-slate-300">No courses added yet.</p>
                    ) : (
                      <ul className="space-y-2">
                        {courseList.map((course, idx) => (
                          <li key={`course-${idx}`} className="surface-subtle px-3 py-2 text-sm text-slate-700 dark:text-slate-200">
                            {course.courseName || "Course"} {course.platform ? `· ${course.platform}` : ""}
                          </li>
                        ))}
                        {(profile?.completedCourses || []).map((course, idx) => (
                          <li key={`completed-${idx}`} className="surface-subtle px-3 py-2 text-sm text-slate-700 dark:text-slate-200">
                            {course}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Certifications</p>
                    {certificationList.length === 0 ? (
                      <p className="text-sm text-slate-600 dark:text-slate-300">No certifications added yet.</p>
                    ) : (
                      <ul className="space-y-2">
                        {certificationList.map((item, idx) => (
                          <li key={`${item.name || "cert"}-${idx}`} className="surface-subtle px-3 py-2 text-sm text-slate-700 dark:text-slate-200">
                            {item.name || "Certification"} {(item.issuer || item.year) ? `· ${[item.issuer, item.year].filter(Boolean).join(" | ")}` : ""}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {languages.length > 0 && (
                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Languages</p>
                      <SkillChips skills={languages} variant="elevated" />
                    </div>
                  )}

                  {missingSkillHints.length > 0 && (
                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Suggested Missing Skills</p>
                      <SkillChips skills={missingSkillHints} variant="elevated" />
                    </div>
                  )}
                </div>
              </SectionPanel>
            )}
          </div>
        )}
      </InternShell>
    </RoleDashboardGuard>
  );
}




