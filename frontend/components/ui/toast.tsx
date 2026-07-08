"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

type ToastVariant = "success" | "error" | "info";

type ToastItem = {
  id: string;
  title: string;
  message?: string;
  variant: ToastVariant;
};

type ToastContextValue = {
  pushToast: (toast: Omit<ToastItem, "id">) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const variantStyles: Record<ToastVariant, string> = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300",
  error: "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300",
  info: "border-slate-200 bg-white text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const pushToast = useCallback((toast: Omit<ToastItem, "id">) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setToasts((current) => [...current, { ...toast, id }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== id));
    }, 4200);
  }, []);

  const value = useMemo(() => ({ pushToast }), [pushToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2 px-4 sm:px-0"
        aria-live="polite"
        aria-atomic="false"
      >
        <AnimatePresence initial={false}>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, y: 12, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.15, ease: "easeIn" } }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className={cn("pointer-events-auto rounded-xl border px-4 py-3 shadow-soft", variantStyles[toast.variant])}
              role="status"
            >
              <p className="text-sm font-semibold">{toast.title}</p>
              {toast.message && <p className="mt-1 text-xs opacity-90">{toast.message}</p>}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}
