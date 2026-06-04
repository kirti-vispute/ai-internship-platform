import { InternAILoader } from "@/components/brand/internai-loader";

export function DashboardPageLoader() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center py-12">
      <InternAILoader message="Loading workspace…" rotateMessages={false} />
    </div>
  );
}
