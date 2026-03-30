"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CompanyShell } from "@/components/dashboard/company-shell";
import { SectionPanel } from "@/components/dashboard/section-panel";
import { SummaryStatCard } from "@/components/dashboard/summary-stat-card";
import { Button } from "@/components/ui/button";
import { RoleDashboardGuard } from "@/components/ui/role-dashboard-guard";
import { clearAuthSession } from "@/lib/session";
import {
  CompanyApplication,
  CompanyInternship,
  CompanyMatchedCandidate,
  CompanyProfile,
  fetchCompanyApplications,
  fetchCompanyInternships,
  fetchCompanyMatchedCandidates,
  fetchCompanyProfile,
  postCompanyInternship,
  updateCompanyProfile
} from "@/lib/company-portal";

export type CompanyDashboardView =
  | "overview"
  | "profile"
  | "profile-edit"
  | "verification"
  | "hiring-post"
  | "hiring-active"
  | "hiring-applicants"
  | "hiring-shortlisted"
  | "hiring-pipeline"
  | "matching-ai"
  | "matching-search"
  | "matching-saved"
  | "reports-feedback"
  | "reports-notes"
  | "reports-export";

const WITH_INTERNSHIPS = new Set<CompanyDashboardView>([
  "overview",
  "hiring-post",
  "hiring-active",
  "hiring-applicants",
  "hiring-shortlisted",
  "hiring-pipeline",
  "matching-ai",
  "matching-search",
  "reports-feedback",
  "reports-notes",
  "reports-export"
]);
const WITH_APPS = new Set<CompanyDashboardView>([
  "overview",
  "hiring-applicants",
  "hiring-shortlisted",
  "hiring-pipeline",
  "matching-search",
  "reports-feedback",
  "reports-notes",
  "reports-export"
]);
const WITH_MATCHES = new Set<CompanyDashboardView>(["overview", "matching-ai", "matching-search"]);

const field = "surface-subtle px-3 py-2 text-sm";

function Empty({ text }: { text: string }) {
  return <div className="surface-subtle px-4 py-3 text-sm text-slate-600 dark:text-slate-300">{text}</div>;
}

function fmtDate(value?: string) {
  if (!value) return "-";
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return "-";
  return dt.toLocaleDateString();
}

export function CompanyDashboardPage({ view }: { view: CompanyDashboardView }) {
  const router = useRouter();
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [internships, setInternships] = useState<CompanyInternship[]>([]);
  const [apps, setApps] = useState<CompanyApplication[]>([]);
  const [matches, setMatches] = useState<CompanyMatchedCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const [profileForm, setProfileForm] = useState({ companyName: "", contactName: "", phone: "", website: "", address: "", description: "" });
  const [postForm, setPostForm] = useState({ role: "", skillsRequired: "", prioritySkills: "", stipend: "", duration: "", location: "", description: "" });

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError(null);
        setSuccess(null);
        const p = await fetchCompanyProfile();
        setProfile(p);
        if (WITH_INTERNSHIPS.has(view)) setInternships(await fetchCompanyInternships());
        else setInternships([]);
        if (WITH_APPS.has(view)) setApps(await fetchCompanyApplications());
        else setApps([]);
        if (WITH_MATCHES.has(view)) setMatches(await fetchCompanyMatchedCandidates());
        else setMatches([]);
      } catch (e) {
        setError((e as Error).message || "Failed to load company data.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [view]);

  useEffect(() => {
    if (!profile) return;
    setProfileForm({
      companyName: profile.companyName || "",
      contactName: profile.contactName || "",
      phone: profile.phone || "",
      website: profile.website || "",
      address: profile.address || "",
      description: profile.description || ""
    });
  }, [profile]);

  function logout() {
    clearAuthSession();
    router.push("/auth/company");
  }

  const shortlisted = useMemo(() => apps.filter((a) => a.status === "shortlisted"), [apps]);
  const statusCounts = useMemo(() => {
    const base: Record<string, number> = { applied: 0, shortlisted: 0, screening: 0, interview: 0, offered: 0, rejected: 0, withdrawn: 0 };
    apps.forEach((a) => (base[a.status] = (base[a.status] || 0) + 1));
    return base;
  }, [apps]);

  const summary = useMemo(
    () => ({
      verification: profile?.verificationStatus || "pending",
      activeInternships: internships.filter((item) => item.isActive).length,
      applicants: apps.length,
      shortlisted: shortlisted.length,
      matched: matches.length
    }),
    [profile?.verificationStatus, internships, apps.length, shortlisted.length, matches.length]
  );

  const searchable = useMemo(() => {
    const rows = [
      ...apps.map((a) => ({ name: a.intern?.fullName || "Candidate", email: a.intern?.email || "", role: a.internship?.role || "", score: a.matchScore || 0, source: "applicant", skills: a.intern?.skills || [] })),
      ...matches.map((m) => ({ name: m.internProfile?.fullName || "Candidate", email: m.internProfile?.email || "", role: m.internshipRole || "", score: m.score || 0, source: "matched", skills: m.internProfile?.skills || [] }))
    ];
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => [r.name, r.email, r.role, ...r.skills].join(" ").toLowerCase().includes(q));
  }, [apps, matches, query]);

  async function saveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      setSaving(true);
      setError(null);
      const updated = await updateCompanyProfile(profileForm);
      setProfile(updated);
      setSuccess("Company profile updated.");
    } catch (e) {
      setError((e as Error).message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  }

  async function createInternship(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!postForm.role.trim() || !postForm.description.trim()) {
      setError("Role and description are required.");
      return;
    }
    try {
      setSaving(true);
      setError(null);
      const toList = (v: string) => v.split(",").map((s) => s.trim()).filter(Boolean);
      await postCompanyInternship({
        role: postForm.role.trim(),
        description: postForm.description.trim(),
        skillsRequired: toList(postForm.skillsRequired),
        prioritySkills: toList(postForm.prioritySkills),
        stipend: postForm.stipend,
        duration: postForm.duration,
        location: postForm.location
      });
      setInternships(await fetchCompanyInternships(true));
      setSuccess("Internship posted successfully.");
      setPostForm({ role: "", skillsRequired: "", prioritySkills: "", stipend: "", duration: "", location: "", description: "" });
    } catch (e) {
      setError((e as Error).message || "Failed to post internship.");
    } finally {
      setSaving(false);
    }
  }

  function exportCsv() {
    const rows = [["candidate", "email", "internship", "status", "matchScore", "createdAt"]];
    apps.forEach((a) => rows.push([a.intern?.fullName || "", a.intern?.email || "", a.internship?.role || "", a.status || "", String(a.matchScore || 0), a.createdAt || ""]));
    const csv = rows
      .map((row) => row.map((item) => (item.includes(",") || item.includes("\n") || item.includes('"') ? `"${item.replace(/"/g, '""')}"` : item)).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `company-report-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function applicantPanel(list: CompanyApplication[], title: string, subtitle: string, emptyText: string) {
    return (
      <SectionPanel title={title} subtitle={subtitle}>
        {list.length === 0 ? <Empty text={emptyText} /> : (
          <div className="space-y-2">
            {list.map((a) => (
              <div key={a._id} className="surface-subtle flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{a.intern?.fullName || "Candidate"}</p>
                  <p className="text-xs text-slate-600 dark:text-slate-300">{a.intern?.email || "No email"}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{a.internship?.role || "Internship"}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs uppercase tracking-wide text-slate-500">{a.status}</p>
                  <p className="text-xs text-slate-500">Match {a.matchScore || 0}%</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionPanel>
    );
  }

  const viewNode: React.ReactNode = (() => {
    switch (view) {
      case "overview":
        return (
          <div className="space-y-7">
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              <SummaryStatCard title="Verification" value={summary.verification.toUpperCase()} />
              <SummaryStatCard title="Active Internships" value={summary.activeInternships} />
              <SummaryStatCard title="Applicants" value={summary.applicants} />
              <SummaryStatCard title="Shortlisted" value={summary.shortlisted} />
              <SummaryStatCard title="Matched Candidates" value={summary.matched} />
            </section>
            <SectionPanel title="Latest Hiring Activity" subtitle="Recent applicant activity.">
              {apps.length === 0 ? <Empty text="No applicants yet." /> : (
                <div className="space-y-2">{apps.slice(0, 6).map((a) => <div key={a._id} className="surface-subtle px-4 py-3 text-sm text-slate-700 dark:text-slate-300">{a.intern?.fullName || "Candidate"} • {a.internship?.role || "Internship"} • {a.status} • {fmtDate(a.createdAt)}</div>)}</div>
              )}
            </SectionPanel>
            <SectionPanel title="Overview Notes" subtitle="Current account status.">
              <div className="space-y-2">
                {summary.activeInternships === 0 && <Empty text="No internships posted yet." />}
                {summary.applicants === 0 && <Empty text="No applicants yet." />}
                {summary.matched === 0 && <Empty text="No matched candidates available yet." />}
              </div>
            </SectionPanel>
          </div>
        );
      case "profile":
        return <SectionPanel title="Company Profile" subtitle="Live company profile data.">{!profile ? <Empty text="Company profile not available." /> : <div className="grid gap-3 sm:grid-cols-2"><div className="surface-subtle px-3 py-2.5"><p className="text-xs text-slate-500">Company</p><p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{profile.companyName || "-"}</p></div><div className="surface-subtle px-3 py-2.5"><p className="text-xs text-slate-500">Email</p><p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{profile.companyEmail || "-"}</p></div><div className="surface-subtle px-3 py-2.5"><p className="text-xs text-slate-500">GST</p><p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{profile.gst || "-"}</p></div><div className="surface-subtle px-3 py-2.5"><p className="text-xs text-slate-500">Contact</p><p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{profile.contactName || "-"}</p></div><div className="surface-subtle px-3 py-2.5"><p className="text-xs text-slate-500">Phone</p><p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{profile.phone || "-"}</p></div><div className="surface-subtle px-3 py-2.5"><p className="text-xs text-slate-500">Website</p><p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{profile.website || "-"}</p></div><div className="surface-subtle px-3 py-2.5 sm:col-span-2"><p className="text-xs text-slate-500">Address</p><p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{profile.address || "-"}</p></div><div className="surface-subtle px-3 py-2.5 sm:col-span-2"><p className="text-xs text-slate-500">Description</p><p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{profile.description || "-"}</p></div></div>}</SectionPanel>;
      case "profile-edit":
        return <SectionPanel title="Edit Company Profile" subtitle="Update profile information."><form className="space-y-4" onSubmit={saveProfile}><div className="grid gap-4 sm:grid-cols-2"><input className={field} placeholder="Company Name" value={profileForm.companyName} onChange={(e) => setProfileForm((p) => ({ ...p, companyName: e.target.value }))} /><input className={field} placeholder="Contact Name" value={profileForm.contactName} onChange={(e) => setProfileForm((p) => ({ ...p, contactName: e.target.value }))} /><input className={field} placeholder="Phone" value={profileForm.phone} onChange={(e) => setProfileForm((p) => ({ ...p, phone: e.target.value }))} /><input className={field} placeholder="Website" value={profileForm.website} onChange={(e) => setProfileForm((p) => ({ ...p, website: e.target.value }))} /><input className={`${field} sm:col-span-2`} placeholder="Address" value={profileForm.address} onChange={(e) => setProfileForm((p) => ({ ...p, address: e.target.value }))} /><textarea className={`${field} min-h-28 sm:col-span-2`} placeholder="Description" value={profileForm.description} onChange={(e) => setProfileForm((p) => ({ ...p, description: e.target.value }))} /></div><Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save Profile"}</Button></form></SectionPanel>;
      case "verification":
        return <SectionPanel title="Verification Status" subtitle="Current verification state."><div className="surface-subtle px-4 py-3 text-sm text-slate-700 dark:text-slate-300">Status: {summary.verification.toUpperCase()}</div></SectionPanel>;
      case "hiring-post":
        return <SectionPanel title="Post Internship" subtitle="Create a new internship posting."><form className="space-y-4" onSubmit={createInternship}><div className="grid gap-4 sm:grid-cols-2"><input className={field} placeholder="Role" value={postForm.role} onChange={(e) => setPostForm((p) => ({ ...p, role: e.target.value }))} /><input className={field} placeholder="Location" value={postForm.location} onChange={(e) => setPostForm((p) => ({ ...p, location: e.target.value }))} /><input className={field} placeholder="Skills Required (comma separated)" value={postForm.skillsRequired} onChange={(e) => setPostForm((p) => ({ ...p, skillsRequired: e.target.value }))} /><input className={field} placeholder="Priority Skills (comma separated)" value={postForm.prioritySkills} onChange={(e) => setPostForm((p) => ({ ...p, prioritySkills: e.target.value }))} /><input className={field} placeholder="Stipend" value={postForm.stipend} onChange={(e) => setPostForm((p) => ({ ...p, stipend: e.target.value }))} /><input className={field} placeholder="Duration" value={postForm.duration} onChange={(e) => setPostForm((p) => ({ ...p, duration: e.target.value }))} /><textarea className={`${field} min-h-28 sm:col-span-2`} placeholder="Description" value={postForm.description} onChange={(e) => setPostForm((p) => ({ ...p, description: e.target.value }))} /></div><Button type="submit" disabled={saving}>{saving ? "Posting..." : "Post Internship"}</Button></form></SectionPanel>;
      case "hiring-active":
        return <SectionPanel title="Active Internships" subtitle="Live internships list.">{internships.filter((i) => i.isActive).length === 0 ? <Empty text="No internships posted yet." /> : <div className="space-y-2">{internships.filter((i) => i.isActive).map((i) => <div key={i._id} className="surface-subtle px-4 py-3"><p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{i.role}</p><p className="text-xs text-slate-600 dark:text-slate-300">{i.location || "Location not specified"}</p><p className="text-xs text-slate-500 dark:text-slate-400">Posted: {fmtDate(i.createdAt)}</p></div>)}</div>}</SectionPanel>;
      case "hiring-applicants":
        return applicantPanel(apps, "Applicants", "All applicants across internships.", "No applicants yet.");
      case "hiring-shortlisted":
        return applicantPanel(shortlisted, "Shortlisted", "Candidates in shortlisted stage.", "No shortlisted candidates yet.");
      case "hiring-pipeline":
        return <SectionPanel title="Hiring Pipeline" subtitle="Real status breakdown.">{apps.length === 0 ? <Empty text="No applicants yet." /> : <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{Object.entries(statusCounts).map(([stage, count]) => <div key={stage} className="surface-subtle px-3 py-2.5"><p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">{stage}</p><p className="text-xl font-bold text-slate-900 dark:text-slate-100">{count}</p></div>)}</div>}</SectionPanel>;
      case "matching-ai":
        return <SectionPanel title="AI Matched Candidates" subtitle="Backend-ranked matched candidates.">{matches.length === 0 ? <Empty text="No matched candidates available yet." /> : <div className="space-y-2">{matches.map((m, idx) => <div key={`${m.internshipId}-${m.internProfile?._id || idx}`} className="surface-subtle flex flex-wrap items-center justify-between gap-2 px-4 py-3"><div><p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{m.internProfile?.fullName || "Candidate"}</p><p className="text-xs text-slate-600 dark:text-slate-300">{m.internshipRole}</p></div><p className="text-sm font-semibold text-primary-700 dark:text-primary-300">{m.score}%</p></div>)}</div>}</SectionPanel>;
      case "matching-search":
        return <SectionPanel title="Candidate Search" subtitle="Search in real applicants and matched candidates."><div className="space-y-3"><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name, email, role, or skill" className={`${field} w-full`} />{searchable.length === 0 ? <Empty text="No candidates found for this search." /> : <div className="space-y-2">{searchable.map((c, idx) => <div key={`${c.email}-${idx}`} className="surface-subtle flex flex-wrap items-center justify-between gap-2 px-4 py-3"><div><p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{c.name}</p><p className="text-xs text-slate-600 dark:text-slate-300">{c.email || "No email"}</p><p className="text-xs text-slate-500 dark:text-slate-400">{c.role}</p></div><div className="text-right"><p className="text-xs uppercase tracking-wide text-slate-500">{c.source}</p><p className="text-sm font-semibold text-primary-700 dark:text-primary-300">{c.score}%</p></div></div>)}</div>}</div></SectionPanel>;
      case "matching-saved":
        return <SectionPanel title="Saved Candidates" subtitle="Saved shortlist bookmarks."><Empty text="No saved candidates yet." /></SectionPanel>;
      case "reports-feedback":
        return <SectionPanel title="Feedback" subtitle="Collected HR feedback on applications.">{apps.flatMap((a) => a.hrFeedback || []).length === 0 ? <Empty text="No feedback added yet." /> : <div className="space-y-2">{apps.flatMap((a) => (a.hrFeedback || []).map((f, idx) => ({ id: `${a._id}-${idx}`, name: a.intern?.fullName || "Candidate", role: a.internship?.role || "Internship", text: f.feedback, createdAt: f.createdAt }))).sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()).map((f) => <div key={f.id} className="surface-subtle px-4 py-3"><p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{f.name}</p><p className="text-xs text-slate-500 dark:text-slate-400">{f.role} • {fmtDate(f.createdAt)}</p><p className="mt-1 text-sm text-slate-700 dark:text-slate-300">{f.text}</p></div>)}</div>}</SectionPanel>;
      case "reports-notes":
        return <SectionPanel title="Hiring Notes" subtitle="Stage notes captured in pipeline updates.">{apps.flatMap((a) => a.stageHistory || []).filter((h) => h.note?.trim()).length === 0 ? <Empty text="No hiring notes available yet." /> : <div className="space-y-2">{apps.flatMap((a) => (a.stageHistory || []).filter((h) => h.note?.trim()).map((h, idx) => ({ id: `${a._id}-${idx}`, name: a.intern?.fullName || "Candidate", role: a.internship?.role || "Internship", stage: h.stage, note: h.note, changedAt: h.changedAt }))).sort((a, b) => new Date(b.changedAt || 0).getTime() - new Date(a.changedAt || 0).getTime()).map((n) => <div key={n.id} className="surface-subtle px-4 py-3"><p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{n.name}</p><p className="text-xs text-slate-500 dark:text-slate-400">{n.role} • {n.stage} • {fmtDate(n.changedAt)}</p><p className="mt-1 text-sm text-slate-700 dark:text-slate-300">{n.note}</p></div>)}</div>}</SectionPanel>;
      case "reports-export":
        return <SectionPanel title="Reports / Export" subtitle="Export live hiring data."><div className="space-y-3"><div className="grid gap-3 sm:grid-cols-3"><div className="surface-subtle px-3 py-2.5"><p className="text-xs text-slate-500">Internships</p><p className="text-lg font-semibold text-slate-900 dark:text-slate-100">{internships.length}</p></div><div className="surface-subtle px-3 py-2.5"><p className="text-xs text-slate-500">Applicants</p><p className="text-lg font-semibold text-slate-900 dark:text-slate-100">{apps.length}</p></div><div className="surface-subtle px-3 py-2.5"><p className="text-xs text-slate-500">Shortlisted</p><p className="text-lg font-semibold text-slate-900 dark:text-slate-100">{shortlisted.length}</p></div></div><Button type="button" onClick={exportCsv} disabled={apps.length === 0}>Export Applicants CSV</Button>{apps.length === 0 && <Empty text="No applicant data available for export." />}</div></SectionPanel>;
      default:
        return null;
    }
  })();

  return (
    <RoleDashboardGuard expectedRole="company">
      <CompanyShell welcomeName={profile?.companyName} onLogout={logout}>
        {loading ? (
          <div className="surface-muted px-4 py-3 text-sm text-slate-700 dark:text-slate-300">Loading company dashboard...</div>
        ) : (
          <div className="space-y-5">
            {error && <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">{error}</div>}
            {success && <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300">{success}</div>}
            {viewNode}
          </div>
        )}
      </CompanyShell>
    </RoleDashboardGuard>
  );
}

