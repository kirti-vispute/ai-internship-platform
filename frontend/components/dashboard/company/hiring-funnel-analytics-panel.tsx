"use client";

import { memo, useMemo } from "react";
import { BarChart3 } from "lucide-react";
import type { CompanyApplication } from "@/lib/company-portal";
import { hiringAIEngine } from "@/lib/ai-hiring";
import {
  CompanyDashboardEmptyState,
  CompanyDashboardMetricTile,
  CompanyDashboardPanelCard,
  CompanyDashboardSection,
  companyDashboardStyles
} from "./company-dashboard-layout";

type HiringFunnelAnalyticsPanelProps = {
  applications: CompanyApplication[];
};

function HiringFunnelAnalyticsPanelInner({ applications }: HiringFunnelAnalyticsPanelProps) {
  const analytics = useMemo(() => hiringAIEngine.computeFunnelAnalytics(applications), [applications]);
  const maxCount = Math.max(...analytics.stages.map((stage) => stage.count), 1);

  const sectionActions = (
    <div className="company-dashboard-metric-tile min-w-[7.5rem] text-right">
      <p className="ds-label">Efficiency Score</p>
      <p className="ds-stat-value mt-1 text-primary-300">{analytics.efficiencyScore}</p>
    </div>
  );

  return (
    <CompanyDashboardSection
      id="hiring-funnel-analytics"
      icon={BarChart3}
      title="Hiring Funnel Analytics"
      description="Stage conversion, drop-off, and hiring efficiency."
      actions={sectionActions}
    >
      {!analytics.sufficient ? (
        <CompanyDashboardEmptyState title="Funnel analytics appear once applications are received." />
      ) : (
        <CompanyDashboardPanelCard>
          <div className="mb-5 space-y-2">
            {analytics.stages.map((stage) => (
              <div key={stage.key} className="grid grid-cols-[5.5rem_1fr_4rem] items-center gap-3">
                <span className="ds-caption font-medium">{stage.label}</span>
                <div className="h-2 overflow-hidden rounded-full bg-white/5">
                  <div
                    className="h-full rounded-full bg-primary-400 transition-all"
                    style={{ width: `${Math.max(4, (stage.count / maxCount) * 100)}%` }}
                  />
                </div>
                <span className="text-right text-sm font-semibold tabular-nums">{stage.count}</span>
              </div>
            ))}
          </div>

          <div className={companyDashboardStyles.metricGridFive}>
            {analytics.stages.map((stage) => (
              <CompanyDashboardMetricTile
                key={`${stage.key}-summary`}
                label={stage.label}
                value={stage.count}
                hint={
                  <>
                    <p>Avg time: {stage.avgDaysInStage === null ? "—" : `${stage.avgDaysInStage}d`}</p>
                    {stage.conversionFromPrevious !== null ? <p className="text-emerald-300">Conv. {stage.conversionFromPrevious}%</p> : null}
                    {stage.dropOffFromPrevious !== null ? <p className="text-rose-400">Drop-off {stage.dropOffFromPrevious}%</p> : null}
                  </>
                }
              />
            ))}
          </div>
        </CompanyDashboardPanelCard>
      )}
    </CompanyDashboardSection>
  );
}

export const HiringFunnelAnalyticsPanel = memo(HiringFunnelAnalyticsPanelInner);
