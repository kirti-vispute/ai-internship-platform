"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Sparkles, X } from "lucide-react";
import { fetchApplicationAiInsights } from "@/lib/intern-portal";

type AiInsightsModalProps = {
  open: boolean;
  internshipId: string | null;
  role?: string;
  companyName?: string;
  onClose: () => void;
};

export function AiInsightsModal({ open, internshipId, role, companyName, onClose }: AiInsightsModalProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [bullets, setBullets] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!open || !internshipId) return;

    let cancelled = false;
    setStatus("loading");
    setErrorMessage("");

    fetchApplicationAiInsights(internshipId)
      .then((result) => {
        if (cancelled) return;
        setBullets(result.bullets || []);
        setStatus("ready");
      })
      .catch((e) => {
        if (cancelled) return;
        setErrorMessage((e as Error).message || "Insights are not available right now.");
        setStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, [open, internshipId]);

  if (!isMounted) return null;

  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[1100] flex items-end justify-center sm:items-center sm:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <button
            type="button"
            className="absolute inset-0 bg-slate-950/60"
            onClick={onClose}
            aria-label="Close AI insights dialog"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="ai-insights-title"
            className="relative z-10 flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900 sm:rounded-2xl"
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <div className="flex items-start justify-between gap-3 border-b border-slate-200 bg-gradient-to-r from-primary-600/10 via-violet-500/10 to-transparent px-5 py-4 dark:border-slate-700">
              <div className="flex min-w-0 flex-1 items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-100 text-primary-700 dark:bg-primary-950/50 dark:text-primary-300">
                  <Sparkles className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <h2 id="ai-insights-title" className="truncate text-base font-semibold text-slate-900 dark:text-slate-100">
                    AI Insights
                  </h2>
                  <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
                    {role ? role : "Internship"}
                    {companyName ? ` · ${companyName}` : ""}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="shrink-0 rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 dark:hover:bg-slate-800"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-5">
              {status === "loading" ? (
                <div className="flex flex-col items-center justify-center gap-2 py-10 text-slate-500 dark:text-slate-400">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <p className="text-sm">Generating your insights…</p>
                </div>
              ) : null}

              {status === "error" ? (
                <p className="text-sm text-slate-600 dark:text-slate-300">{errorMessage}</p>
              ) : null}

              {status === "ready" ? (
                <ul className="space-y-3">
                  {bullets.map((bullet, idx) => (
                    <li key={idx} className="flex gap-2.5 rounded-xl border border-slate-200/70 bg-slate-50/60 px-4 py-3 text-sm leading-relaxed text-slate-700 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-200">
                      <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-violet-500" />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body
  );
}
