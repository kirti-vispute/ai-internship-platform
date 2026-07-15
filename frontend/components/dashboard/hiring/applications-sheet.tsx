"use client";

import { useEffect, useMemo, useState } from "react";
import { Users } from "lucide-react";
import type { CompanyApplication } from "@/lib/company-portal";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Pagination } from "@/components/ui/pagination";
import { normalizeToFlowStage } from "./hiring-utils";

const PAGE_SIZE = 12;

const STAGE_TONE: Record<string, BadgeTone> = {
  applied: "warning",
  shortlisted: "info",
  interview: "info",
  interview_scheduled: "info",
  interviewed: "info",
  selected: "success",
  rejected: "danger"
};

type ApplicationsSheetProps = {
  open: boolean;
  title: string;
  subtitle?: string;
  applications: CompanyApplication[];
  filterStage?: "interview" | null;
  onClose: () => void;
  onViewProfile: (applicationId: string) => void;
};

export function ApplicationsSheet({
  open,
  title,
  subtitle,
  applications,
  filterStage = null,
  onClose,
  onViewProfile
}: ApplicationsSheetProps) {
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    if (!filterStage) return applications;
    return applications.filter((application) => normalizeToFlowStage(application.status) === filterStage);
  }, [applications, filterStage]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const visible = filtered.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);

  useEffect(() => {
    if (open) setPage(0);
  }, [open, title, filterStage]);

  return (
    <Modal open={open} onClose={onClose} title={title} subtitle={subtitle} icon={Users} size="lg">
      {filtered.length === 0 ? (
        <p className="ds-caption py-8 text-center">No applications in this view.</p>
      ) : (
        <div className="space-y-2">
          {visible.map((application) => {
            const stage = normalizeToFlowStage(application.status);
            return (
              <div
                key={application._id}
                className="company-dashboard-item-card flex flex-col gap-3 !p-3.5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-[var(--ds-text)]">
                    {application.intern?.fullName || "Candidate"}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    <p className="truncate text-xs text-[var(--ds-muted)]">{application.internship?.role || "Role"}</p>
                    <Badge tone={STAGE_TONE[stage] || "neutral"} className="capitalize">
                      {stage.replace(/_/g, " ")}
                    </Badge>
                  </div>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    onViewProfile(application._id);
                    onClose();
                  }}
                >
                  View Profile
                </Button>
              </div>
            );
          })}
        </div>
      )}

      {filtered.length > PAGE_SIZE && (
        <div className="mt-4 flex items-center justify-between border-t border-[var(--ds-border)] pt-4">
          <p className="ds-caption">
            Page {safePage + 1} of {totalPages}
          </p>
          <Pagination page={safePage + 1} totalPages={totalPages} onChange={(next) => setPage(next - 1)} />
        </div>
      )}
    </Modal>
  );
}
