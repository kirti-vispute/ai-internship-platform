import dynamic from "next/dynamic";
import { notFound } from "next/navigation";
import { DashboardPageLoader } from "@/components/ui/dashboard-page-loader";
import type { CompanyDashboardView } from "@/components/dashboard/company-dashboard-page";

const CompanyDashboardPage = dynamic(
  () => import("@/components/dashboard/company-dashboard-page").then((mod) => mod.CompanyDashboardPage),
  { loading: () => <DashboardPageLoader /> }
);

const VIEW_MAP: Record<string, CompanyDashboardView> = {
  profile: "profile",
  "profile/edit": "profile-edit",
  "profile/verification": "verification",
  "hiring/post": "hiring-post",
  "hiring/active": "hiring-active",
  "hiring/applicants": "hiring-applicants",
  "hiring/shortlisted": "hiring-shortlisted",
  "hiring/pipeline": "hiring-pipeline",
  "matching/ai": "matching-ai",
  "matching/search": "matching-search",
  "matching/saved": "matching-saved",
  "reports/feedback": "reports-feedback",
  "reports/notes": "reports-notes",
  "reports/export": "reports-export",
  "team/recruiters": "team-recruiters",
  "analytics/company": "analytics-company",
  "analytics/salary": "analytics-salary"
};

export default async function CompanyDashboardViewRoute({
  params
}: {
  params: Promise<{ view?: string[] }>;
}) {
  const { view } = await params;
  const key = (view || []).join("/");
  const mappedView = VIEW_MAP[key];

  if (!mappedView) {
    notFound();
  }

  return <CompanyDashboardPage view={mappedView} />;
}
