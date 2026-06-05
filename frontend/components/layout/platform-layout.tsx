import { HomepageBackground } from "@/components/home/HomepageBackground";

type PlatformLayoutProps = {
  children: React.ReactNode;
};

/**
 * Shared starfield + platform design tokens for all non-home routes.
 * Homepage keeps its own layout unchanged.
 */
export function PlatformLayout({ children }: PlatformLayoutProps) {
  return (
    <div className="internai-platform min-h-screen">
      <HomepageBackground />
      <div className="internai-platform-content">{children}</div>
    </div>
  );
}
