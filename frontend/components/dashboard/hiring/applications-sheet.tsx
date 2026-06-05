"use client";

import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import type { CompanyApplication } from "@/lib/company-portal";
import { Button } from "@/components/ui/button";
import { normalizeToFlowStage } from "./hiring-utils";

const PAGE_SIZE = 12;

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

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <button type="button" className="absolute inset-0 bg-slate-900/40 backdrop-blur-[1px]" onClick={onClose} aria-label="Close applications" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="applications-sheet-title"
        className="relative z-10 flex max-h-[85vh] w-full max-w-2xl flex-col rounded-t-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900 sm:rounded-2xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4 dark:border-slate-800">
          <div>
            <h2 id="applications-sheet-title" className="text-base font-semibold text-slate-900 dark:text-slate-100">
              {title}
            </h2>
            {subtitle ? <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{subtitle}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {filtered.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">No applications in this view.</p>
          ) : (
            <div className="space-y-2">
              {visible.map((application) => (
                <div
                  key={application._id}
                  className="flex flex-col gap-3 rounded-xl border border-slate-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                      {application.intern?.fullName || "Candidate"}
                    </p>
                    <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                      {application.internship?.role || "Role"} · {normalizeToFlowStage(application.status)}
                    </p>
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
              ))}
            </div>
          )}
        </div>

        {filtered.length > PAGE_SIZE && (
          <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 dark:border-slate-800">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Page {safePage + 1} of {totalPages}
            </p>
            <div className="flex gap-2">
              <Button type="button" size="sm" variant="ghost" disabled={safePage === 0} onClick={() => setPage((current) => current - 1)}>
                Previous
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={safePage >= totalPages - 1}
                onClick={() => setPage((current) => current + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
