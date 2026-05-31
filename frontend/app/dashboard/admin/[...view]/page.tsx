import { notFound } from "next/navigation";
import { AdminDashboardPage, AdminDashboardView } from "@/components/dashboard/admin-dashboard-page";

const VIEW_MAP: Record<string, AdminDashboardView> = {
  users: "users",
  companies: "companies",
  verification: "verification",
  internships: "internships",
  reports: "reports",
  "activity-logs": "activity-logs",
  analytics: "analytics",
  notifications: "notifications",
  settings: "settings"
};

export default async function AdminDashboardViewRoute({
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

  return <AdminDashboardPage view={mappedView} />;
}
