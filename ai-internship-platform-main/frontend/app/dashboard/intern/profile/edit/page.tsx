"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RoleDashboardGuard } from "@/components/ui/role-dashboard-guard";
import { InternShell } from "@/components/dashboard/intern-shell";
import { SectionPanel } from "@/components/dashboard/section-panel";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { clearAuthSession } from "@/lib/session";
import { apiRequest } from "@/lib/api-client";
import { InternProfile, fetchInternProfile, invalidateInternCache } from "@/lib/intern-portal";
import { SkillSelector } from "@/components/dashboard/skill-selector";
import { validateLinkedInUrl } from "@/lib/validation";

export default function EditInternProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<InternProfile | null>(null);
  const [fullName, setFullName] = useState("");
  const [mobile, setMobile] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [summary, setSummary] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const data = await fetchInternProfile(true);
        setProfile(data);
        setFullName(data.fullName || "");
        setMobile(data.mobile || "");
        setSkills(data.skills || []);
        setSummary(data.summary || "");
        setLinkedinUrl(data.linkedinUrl || "");
      } catch (err) {
        setError((err as Error).message || "Failed to load profile.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function save() {
    try {
      setSaving(true);
      setError(null);
      setMessage(null);
      if (linkedinUrl && !validateLinkedInUrl(linkedinUrl)) {
        setError("Please enter a valid LinkedIn URL.");
        return;
      }
      const response = await apiRequest<{ profile: InternProfile }>("/api/intern/profile", {
        method: "PUT",
        body: JSON.stringify({ fullName, mobile, skills, summary, linkedinUrl })
      });
      invalidateInternCache();
      setProfile(response.profile);
      setMessage("Profile updated successfully.");
    } catch (err) {
      setError((err as Error).message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  }

  function handleLogout() {
    clearAuthSession();
    router.push("/auth/intern");
  }

  return (
    <RoleDashboardGuard expectedRole="intern">
      <InternShell welcomeName={profile?.fullName} onLogout={handleLogout}>
        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600">Loading profile form...</div>
        ) : (
          <SectionPanel title="Edit Profile" subtitle="Update details used for matching and recommendations.">
            {error && <div className="mb-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>}
            {message && <div className="mb-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</div>}
            <div className="grid gap-3 md:grid-cols-3">
              <Input label="Full Name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
              <Input label="Mobile" value={mobile} onChange={(e) => setMobile(e.target.value)} />
              <Input label="LinkedIn Profile URL" value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} />
            </div>
            <div className="mt-3">
              <Input label="Professional Summary" value={summary} onChange={(e) => setSummary(e.target.value)} />
            </div>
            <div className="mt-3">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Skills</p>
              <SkillSelector selected={skills} onChange={setSkills} />
            </div>
            <div className="mt-4">
              <Button type="button" size="sm" onClick={save} disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </SectionPanel>
        )}
      </InternShell>
    </RoleDashboardGuard>
  );
}

