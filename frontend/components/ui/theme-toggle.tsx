"use client";

import { useEffect, useState } from "react";
import { AppTheme, applyTheme, resolveInitialTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";

type ThemeToggleProps = {
  className?: string;
};

export function ThemeToggle({ className }: ThemeToggleProps) {
  const [theme, setTheme] = useState<AppTheme>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const initial = resolveInitialTheme();
    setTheme(initial);
    applyTheme(initial);
    setMounted(true);
  }, []);

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    applyTheme(next);
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label="Toggle theme"
      className={cn(
        "group inline-flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary-200 hover:bg-primary-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-primary-500/60 dark:hover:bg-slate-800",
        className
      )}
    >
      <span className="relative inline-flex h-4 w-4 items-center justify-center">
        <svg
          viewBox="0 0 24 24"
          className={cn(
            "absolute h-4 w-4 transition-all duration-300",
            mounted && theme === "dark" ? "scale-0 opacity-0" : "scale-100 opacity-100"
          )}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2.2M12 19.8V22M4.2 4.2l1.6 1.6M18.2 18.2l1.6 1.6M2 12h2.2M19.8 12H22M4.2 19.8l1.6-1.6M18.2 5.8l1.6-1.6" />
        </svg>
        <svg
          viewBox="0 0 24 24"
          className={cn(
            "absolute h-4 w-4 transition-all duration-300",
            mounted && theme === "dark" ? "scale-100 opacity-100" : "scale-0 opacity-0"
          )}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4 7 7 0 0 0 20 14.5z" />
        </svg>
      </span>
      <span>{mounted && theme === "dark" ? "Dark" : "Light"}</span>
    </button>
  );
}
