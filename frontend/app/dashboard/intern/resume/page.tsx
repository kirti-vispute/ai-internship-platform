"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { RoleDashboardGuard } from "@/components/ui/role-dashboard-guard";
import { InternShell } from "@/components/dashboard/intern-shell";
import { SectionPanel } from "@/components/dashboard/section-panel";
import { Button } from "@/components/ui/button";
import { clearAuthSession } from "@/lib/session";
import { apiRequest } from "@/lib/api-client";
import { InternProfile, fetchInternProfile } from "@/lib/intern-portal";

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
        setProfile(await fetchInternProfile());
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
      await apiRequest("/api/intern/resume/upload", { method: "POST", body: formData });
      setMessage("Resume uploaded successfully.");
      setProfile(await fetchInternProfile());
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
          <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600">Loading resume page...</div>
        ) : (
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
        )}
      </InternShell>
    </RoleDashboardGuard>
  );
}
