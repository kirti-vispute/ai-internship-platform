import { DashboardErrorBoundary } from "@/components/ui/dashboard-error-boundary";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardErrorBoundary>
      <div className="min-h-screen">{children}</div>
    </DashboardErrorBoundary>
  );
}
