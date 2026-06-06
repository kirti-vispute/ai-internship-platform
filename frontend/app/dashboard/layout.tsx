import { PlatformLayout } from "@/components/layout/platform-layout";
import { DashboardErrorBoundary } from "@/components/ui/dashboard-error-boundary";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardErrorBoundary>
      <PlatformLayout>
        <div className="min-h-screen">{children}</div>
      </PlatformLayout>
    </DashboardErrorBoundary>
  );
}
