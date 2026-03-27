"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { RoleDashboardGuard } from "@/components/ui/role-dashboard-guard";
import { InternShell } from "@/components/dashboard/intern-shell";
import { SectionPanel } from "@/components/dashboard/section-panel";
import { SkillChips } from "@/components/dashboard/skill-chips";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { clearAuthSession } from "@/lib/session";
import { apiRequest } from "@/lib/api-client";
import { InternProfile, fetchInternProfile, invalidateInternCache } from "@/lib/intern-portal";

export default function InternResumePage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [profile, setProfile] = useState<InternProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setProfile(await fetchInternProfile(true));
      } catch (err) {
        setError((err as Error).message || "Failed to load resume details.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleUpload(file: File) {
    try {
      setUploading(true);
      setError(null);
      setMessage(null);

      const formData = new FormData();
      formData.append("resume", file);
      const response = await apiRequest<{ profile: InternProfile }>("/api/intern/resume/upload", { method: "POST", body: formData });
      invalidateInternCache();
      setMessage("Resume uploaded successfully.");
      setProfile(response.profile);
    } catch (err) {
      setError((err as Error).message || "Resume upload failed.");
    } finally {
      setUploading(false);
    }
  }

  function handleLogout() {
    clearAuthSession();
    router.push("/auth?role=intern");
  }

  const parsed = profile?.resume?.parsed;
  const projects = parsed?.projects || [];
  const education = parsed?.education || [];
  const certifications = parsed?.certifications || [];
  const achievements = parsed?.achievements || profile?.achievements || [];
  const languages = parsed?.languages || [];

  return (
    <RoleDashboardGuard expectedRole="intern">
      <InternShell welcomeName={profile?.fullName} onLogout={handleLogout}>
        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
            <Skeleton className="h-4 w-52" />
            <Skeleton className="mt-3 h-16 w-full" />
            <Skeleton className="mt-3 h-10 w-40" />
          </div>
        ) : (
          <div className="space-y-7">
            <SectionPanel title="Resume" subtitle="Upload and manage your resume file.">
              {error && <div className="mb-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">{error}</div>}
              {message && <div className="mb-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300">{message}</div>}

              <div className="grid gap-3 text-sm text-slate-700 dark:text-slate-300 sm:grid-cols-2">
                <p>
                  Uploaded file: <span className="font-semibold">{profile?.resume?.filePath || "No resume uploaded"}</span>
                </p>
                <p>
                  Resume uploaded status: <span className="font-semibold">{profile?.resumeUploaded ? "Yes" : "No"}</span>
                </p>
              </div>

              <div className="mt-4">
                <Button type="button" variant="secondary" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
                  {uploading ? "Uploading..." : "Upload Resume"}
                </Button>
                <input
                  ref={fileRef}
                  type="file"
                  className="hidden"
                  accept=".pdf,.doc,.docx,.txt"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) handleUpload(file);
                  }}
                />
              </div>
            </SectionPanel>

            <SectionPanel title="Parsed Resume Details" subtitle="Structured extraction from your latest uploaded resume.">
              {!profile?.resumeUploaded ? (
                <p className="text-sm text-slate-600 dark:text-slate-300">Upload resume to view parsed details.</p>
              ) : (
                <div className="space-y-5">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Summary</p>
                    <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">{parsed?.summary || profile?.summary || "No summary extracted."}</p>
                    {parsed?.location && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{parsed.location}</p>}
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Skills</p>
                    <div className="mt-2">
                      <SkillChips skills={parsed?.skills || profile?.skills || []} />
                    </div>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-2">
                    <div className="surface-subtle p-3.5">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Projects</p>
                      {projects.length === 0 ? (
                        <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">No projects extracted.</p>
                      ) : (
                        <div className="mt-2 space-y-2">
                          {projects.slice(0, 5).map((project, idx) => (
                            <div key={`project-${idx}`} className="surface-subtle p-2.5">
                              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{project.title || "Project"}</p>
                              {project.description && <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">{project.description}</p>}
                              {project.techStack && project.techStack.length > 0 && <div className="mt-2"><SkillChips skills={project.techStack} /></div>}
                              {project.demoLink && <a href={project.demoLink} target="_blank" rel="noreferrer" className="mt-1 inline-block text-xs font-medium text-blue-700 hover:underline">View demo</a>}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="surface-subtle p-3.5">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Education</p>
                      {education.length === 0 ? (
                        <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">No education extracted.</p>
                      ) : (
                        <div className="mt-2 space-y-2">
                          {education.slice(0, 5).map((edu, idx) => (
                            <div key={`edu-${idx}`} className="surface-subtle p-2.5">
                              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{edu.degree || "Education"}</p>
                              <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">{edu.institution || edu.raw || "-"}</p>
                              {(edu.startYear || edu.endYear) && <p className="mt-1 text-xs text-slate-500">{[edu.startYear, edu.endYear].filter(Boolean).join(" - ")}</p>}
                              {edu.grade && <p className="mt-1 text-xs text-slate-500">Grade: {edu.grade}</p>}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-2">
                    <div className="surface-subtle p-3.5">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Certifications</p>
                      {certifications.length === 0 ? (
                        <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">No certifications extracted.</p>
                      ) : (
                        <ul className="mt-2 space-y-2">
                          {certifications.slice(0, 6).map((cert, idx) => (
                            <li key={`cert-${idx}`} className="surface-subtle p-2.5">
                              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{cert.name || cert.raw || "Certification"}</p>
                              {(cert.issuer || cert.year) && <p className="text-xs text-slate-500">{[cert.issuer, cert.year].filter(Boolean).join(" | ")}</p>}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <div className="surface-subtle p-3.5">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Achievements</p>
                      {achievements.length === 0 ? (
                        <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">No achievements extracted.</p>
                      ) : (
                        <ul className="mt-2 space-y-2">
                          {achievements.slice(0, 8).map((item, idx) => (
                            <li key={`achievement-${idx}`} className="surface-subtle px-2.5 py-1.5 text-sm text-slate-700 dark:text-slate-200">
                              {item}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>

                  {languages.length > 0 && (
                    <div className="surface-subtle p-3.5">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Languages</p>
                      <div className="mt-2">
                        <SkillChips skills={languages} />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </SectionPanel>
          </div>
        )}
      </InternShell>
    </RoleDashboardGuard>
  );
}

