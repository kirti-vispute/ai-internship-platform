import { InternDashboardFrame } from "@/components/dashboard/intern-dashboard-frame";

export default function InternDashboardLayout({ children }: { children: React.ReactNode }) {
  return <InternDashboardFrame>{children}</InternDashboardFrame>;
}
