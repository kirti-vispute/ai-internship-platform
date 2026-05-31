"use client";

import { useEffect, useState } from "react";
import { SectionPanel } from "@/components/dashboard/section-panel";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/api-client";
import { InternProfile, fetchInternProfile, invalidateInternCache, peekInternProfile } from "@/lib/intern-portal";
import { SkillSelector } from "@/components/dashboard/skill-selector";
import { validateLinkedInUrl } from "@/lib/validation";

export default function EditInternProfilePage() {
  const [profile, setProfile] = useState<InternProfile | null>(null);
  const [fullName, setFullName] = useState("");
  const [mobile, setMobile] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [summary, setSummary] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [loading, setLoading] = useState(() => typeof window === "undefined" ? true : !peekInternProfile());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        if (!peekInternProfile()) setLoading(true);
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

  return (
    <>
      {loading ? (
          <div className="rounded-2xl border border-slate-700 bg-slate-900 p-5 text-sm text-slate-600">Loading profile form...</div>
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
    </>
  );
}
