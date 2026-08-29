"use client";

import { useState } from "react";
import { Briefcase, FileSpreadsheet, GraduationCap, ShieldCheck, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AppIcon } from "@/components/icons/app-icon";
import { useToast } from "@/components/ui/toast";
import { downloadAdminExcelExport, type AdminExcelExportKey } from "@/lib/admin-exports";

const EXPORTS: Array<{
  key: AdminExcelExportKey;
  icon: typeof FileSpreadsheet;
  title: string;
  description: string;
}> = [
  {
    key: "candidates",
    icon: FileSpreadsheet,
    title: "Internship Candidates",
    description: "Every application: candidate details, applied role, company, status, and match score."
  },
  {
    key: "internships",
    icon: Briefcase,
    title: "Total Internships",
    description: "All internship postings with company, location, stipend, skills, and status."
  },
  {
    key: "users-intern",
    icon: GraduationCap,
    title: "Users — Interns",
    description: "All registered intern accounts with contact details, skills, and resume score."
  },
  {
    key: "users-hr",
    icon: Users,
    title: "Users — HR",
    description: "All company accounts with the HR account type."
  },
  {
    key: "users-ceo",
    icon: ShieldCheck,
    title: "Users — CEO",
    description: "All company accounts with the CEO account type."
  }
];

export function AdminExportsPanel() {
  const { pushToast } = useToast();
  const [busyKey, setBusyKey] = useState<AdminExcelExportKey | null>(null);

  async function handleDownload(key: AdminExcelExportKey, title: string) {
    try {
      setBusyKey(key);
      const result = await downloadAdminExcelExport(key);
      pushToast({ title: "Export ready", message: `${result.filename} downloaded successfully.`, variant: "success" });
    } catch (error) {
      pushToast({
        title: "Export failed",
        message: (error as Error).message || `Unable to export ${title}.`,
        variant: "error"
      });
    } finally {
      setBusyKey(null);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {EXPORTS.map((item) => (
        <Card key={item.key} className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--ds-chart-1)]/25 to-[var(--ds-chart-1)]/5 text-[var(--ds-chart-1)] ring-1 ring-inset ring-[var(--ds-chart-1)]/25">
              <AppIcon icon={item.icon} size="sm" className="!text-current" />
            </div>
            <h3 className="text-base font-bold text-[var(--ds-text)]">{item.title}</h3>
          </div>
          <p className="text-sm text-[var(--ds-text-secondary)]">{item.description}</p>
          <Button
            size="sm"
            variant="secondary"
            className="mt-auto w-fit gap-2"
            disabled={busyKey === item.key}
            onClick={() => handleDownload(item.key, item.title)}
          >
            <AppIcon icon={FileSpreadsheet} size="xs" className="text-current" />
            {busyKey === item.key ? "Generating…" : "Download Excel"}
          </Button>
        </Card>
      ))}
    </div>
  );
}
