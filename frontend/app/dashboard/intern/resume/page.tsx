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

  return (
    <RoleDashboardGuard expectedRole="intern">
      <InternShell welcomeName={profile?.fullName} onLogout={handleLogout}>
        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <Skeleton className="h-4 w-52" />
            <Skeleton className="mt-3 h-16 w-full" />
            <Skeleton className="mt-3 h-10 w-40" />
          </div>
        ) : (
          <div className="space-y-6">
            <SectionPanel title="Resume" subtitle="Upload and manage your resume file.">
              {error && <div className="mb-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>}
              {message && <div className="mb-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</div>}

              <div className="space-y-3 text-sm text-slate-700">
                <p>Uploaded: <span className="font-semibold">{profile?.resume?.filePath || "No resume uploaded"}</span></p>
                <p>Resume uploaded status: <span className="font-semibold">{profile?.resumeUploaded ? "Yes" : "No"}</span></p>
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
                <p className="text-sm text-slate-600">Upload resume to view parsed details.</p>
              ) : (
                <div className="space-y-5">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Summary</p>
                    <p className="mt-1 text-sm text-slate-700">{profile?.resume?.parsed?.summary || profile?.summary || "No summary extracted."}</p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Skills</p>
                    <div className="mt-2">
                      <SkillChips skills={profile?.resume?.parsed?.skills || profile?.skills || []} />
                    </div>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-2">
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Projects</p>
                      <ul className="mt-2 space-y-1 text-sm text-slate-700">
                        {(profile?.resume?.parsed?.projects || []).slice(0, 5).map((project, idx) => (
                          <li key={`project-${idx}`} className="rounded bg-white px-2 py-1">
                            {project.title || project.description || "Project"}
                          </li>
                        ))}
                        {(profile?.resume?.parsed?.projects || []).length === 0 && <li>No projects extracted.</li>}
                      </ul>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Education</p>
                      <ul className="mt-2 space-y-1 text-sm text-slate-700">
                        {(profile?.resume?.parsed?.education || []).slice(0, 5).map((edu, idx) => (
                          <li key={`edu-${idx}`} className="rounded bg-white px-2 py-1">
                            {[edu.degree, edu.college, edu.year].filter(Boolean).join(" • ") || edu.raw || "Education entry"}
                          </li>
                        ))}
                        {(profile?.resume?.parsed?.education || []).length === 0 && <li>No education extracted.</li>}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </SectionPanel>
          </div>
        )}
      </InternShell>
    </RoleDashboardGuard>
  );
}
