"use client";

import { useState } from "react";
import { SectionPanel } from "@/components/dashboard/section-panel";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { reportCompany } from "@/lib/intern-portal";

export default function SupportPage() {
  const { pushToast } = useToast();
  const [companyId, setCompanyId] = useState("");
  const [internshipId, setInternshipId] = useState("");
  const [reportType, setReportType] = useState("fake_internship");
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [evidenceUrls, setEvidenceUrls] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submitReport() {
    try {
      setSubmitting(true);
      if (!companyId.trim() || !reason.trim()) {
        pushToast({ variant: "error", title: "Missing fields", message: "Company ID and reason are required." });
        return;
      }
      await reportCompany({
        companyId: companyId.trim(),
        reason: reason.trim(),
        details: details.trim(),
        reportType,
        internshipId: internshipId.trim() || undefined,
        evidenceUrls: evidenceUrls
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean)
      });
      pushToast({ variant: "success", title: "Report submitted", message: "Admin will review your report." });
      setReason("");
      setDetails("");
      setEvidenceUrls("");
    } catch (err) {
      pushToast({ variant: "error", title: "Report failed", message: (err as Error).message });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="dashboard-stack">
      <DashboardPageHeader eyebrow="Support" title="Help / Support" subtitle="Report suspicious companies or internships with evidence." />

      <SectionPanel title="Report a Company" subtitle="Submit scam, fake internship, or abusive HR reports for admin review.">
        <div className="form-grid">
          <Input label="Company ID" value={companyId} onChange={(e) => setCompanyId(e.target.value)} placeholder="MongoDB company _id" />
          <Input label="Internship ID (optional)" value={internshipId} onChange={(e) => setInternshipId(e.target.value)} />
          <label className="block w-full sm:col-span-2">
            <span className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Report Type</span>
            <select
              className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
            >
              <option value="fake_internship">Fake Internship</option>
              <option value="scam_company">Scam Company</option>
              <option value="abusive_hr">Abusive HR</option>
              <option value="inappropriate_behavior">Inappropriate Behavior</option>
              <option value="other">Other</option>
            </select>
          </label>
          <Input label="Reason" className="sm:col-span-2" value={reason} onChange={(e) => setReason(e.target.value)} />
        </div>
        <div className="mt-4">
          <Textarea label="Details" value={details} onChange={(e) => setDetails(e.target.value)} rows={3} />
        </div>
        <div className="mt-4">
          <Input
            label="Evidence URLs (comma separated)"
            value={evidenceUrls}
            onChange={(e) => setEvidenceUrls(e.target.value)}
            placeholder="https://..., https://..."
          />
        </div>
        <div className="mt-4">
          <Button type="button" size="sm" onClick={submitReport} disabled={submitting}>
            {submitting ? "Submitting..." : "Submit Report"}
          </Button>
        </div>
      </SectionPanel>

      <SectionPanel title="Help Resources" subtitle="Quick guidance for common issues.">
        <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
          <li className="surface-subtle px-3 py-2">Upload your latest resume before applying or requesting recommendations.</li>
          <li className="surface-subtle px-3 py-2">Check notifications for interview schedules and recruiter feedback.</li>
          <li className="surface-subtle px-3 py-2">Use Track Progress to monitor your application pipeline stages.</li>
        </ul>
      </SectionPanel>
    </div>
  );
}
