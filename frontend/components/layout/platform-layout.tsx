type PlatformLayoutProps = {
  children: React.ReactNode;
};

/** Lightweight static shell for dashboard/auth — no animated starfield. */
export function PlatformLayout({ children }: PlatformLayoutProps) {
  return (
    <div className="internai-platform min-h-screen bg-gradient-to-b from-[#070d1a] via-[#0f172a] to-[#070d1a]">
      <div className="internai-platform-content">{children}</div>
    </div>
  );
}
