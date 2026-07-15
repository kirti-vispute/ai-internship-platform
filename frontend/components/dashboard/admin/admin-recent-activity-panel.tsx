"use client";

import { memo } from "react";
import { Activity } from "lucide-react";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { AppIcon } from "@/components/icons/app-icon";
import { EmptyState } from "@/components/dashboard/empty-state";
import type { AdminActivityLog } from "@/lib/admin-portal";

function formatDateTime(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function AdminRecentActivityPanelInner({ logs }: { logs: AdminActivityLog[] }) {
  const recent = logs.slice(0, 8);

  return (
    <ScrollReveal variant="fade-up" distance={12}>
      <div className="ds-card p-6">
        <div className="mb-4 flex items-center gap-2">
          <AppIcon icon={Activity} size="sm" className="text-primary-600 dark:text-primary-400" />
          <h3 className="ds-h3">Recent Platform Activity</h3>
        </div>

        {recent.length === 0 ? (
          <EmptyState title="No activity recorded yet" hint="Administrative and hiring actions will appear here." presetKey="activity" />
        ) : (
          <ul className="space-y-2">
            {recent.map((log) => (
              <li
                key={log._id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 dark:border-slate-700 dark:bg-slate-900/60"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold capitalize text-slate-800 dark:text-slate-100">
                    {(log.action || "").replace(/_/g, " ") || "Action"}
                  </p>
                  <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                    {log.actorUser?.email ? `${log.actorUser.email} · ` : log.actorRole ? `${log.actorRole} · ` : ""}
                    {log.entityType || ""}
                  </p>
                </div>
                <span className="shrink-0 text-xs text-slate-400">{formatDateTime(log.createdAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </ScrollReveal>
  );
}

export const AdminRecentActivityPanel = memo(AdminRecentActivityPanelInner);
