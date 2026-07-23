"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Download, Share, X } from "lucide-react";
import { AppIcon } from "@/components/icons/app-icon";

// beforeinstallprompt is not yet in the standard DOM lib types.
type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "internai-install-dismissed";

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // iOS Safari exposes navigator.standalone when launched from the home screen.
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isIos(): boolean {
  if (typeof window === "undefined") return false;
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

/**
 * Installability UX built on the standard beforeinstallprompt event
 * (Chrome / Edge / Android). iOS Safari has no such API, so we fall back to
 * on-screen "Add to Home Screen" instructions. Hidden entirely once installed.
 */
export function InstallPrompt() {
  const deferredPrompt = useRef<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [mode, setMode] = useState<"prompt" | "ios">("prompt");

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isStandalone()) return; // already installed — never prompt
    let dismissed = false;
    try {
      dismissed = window.localStorage.getItem(DISMISS_KEY) === "1";
    } catch {
      dismissed = false;
    }
    if (dismissed) return;

    let promptFired = false;

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault(); // stop the mini-infobar; we drive our own UI
      promptFired = true;
      deferredPrompt.current = event as BeforeInstallPromptEvent;
      setMode("prompt");
      setVisible(true);
    };

    const onInstalled = () => {
      deferredPrompt.current = null;
      setVisible(false);
      try {
        window.localStorage.setItem(DISMISS_KEY, "1");
      } catch {
        // ignore storage failures
      }
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onInstalled);

    // iOS fallback: no beforeinstallprompt will ever fire there.
    const iosTimer = window.setTimeout(() => {
      if (!promptFired && isIos() && !isStandalone()) {
        setMode("ios");
        setVisible(true);
      }
    }, 2500);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
      window.clearTimeout(iosTimer);
    };
  }, []);

  const install = async () => {
    const promptEvent = deferredPrompt.current;
    if (!promptEvent) return;
    await promptEvent.prompt();
    await promptEvent.userChoice;
    deferredPrompt.current = null;
    setVisible(false);
  };

  const dismiss = () => {
    setVisible(false);
    try {
      window.localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // ignore storage failures
    }
  };

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          role="dialog"
          aria-label="Install InternAI"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="fixed inset-x-4 bottom-4 z-[999] mx-auto flex max-w-sm items-start gap-3 rounded-2xl border border-[var(--ds-border)] bg-[var(--ds-surface-raised,var(--ds-card))] p-4 shadow-lg sm:left-4 sm:right-auto sm:mx-0"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--ds-info-bg)] text-[var(--ds-primary)]">
            <AppIcon icon={mode === "ios" ? Share : Download} size="sm" className="text-current" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-[var(--ds-text)]">Install InternAI</p>
            {mode === "ios" ? (
              <p className="mt-0.5 text-xs leading-relaxed text-[var(--ds-muted)]">
                Tap the Share icon, then choose <span className="font-medium text-[var(--ds-text)]">Add to Home Screen</span>.
              </p>
            ) : (
              <p className="mt-0.5 text-xs text-[var(--ds-muted)]">Add it to your device for a faster, app-like experience.</p>
            )}
            {mode === "prompt" ? (
              <button
                type="button"
                onClick={install}
                className="mt-2.5 inline-flex items-center gap-1.5 rounded-lg bg-[var(--ds-primary)] px-3 py-1.5 text-sm font-semibold text-[var(--ds-on-primary)] transition-colors hover:bg-[var(--ds-primary-hover)]"
              >
                <AppIcon icon={Download} size="xs" className="text-current" />
                Install
              </button>
            ) : null}
          </div>
          <button
            type="button"
            onClick={dismiss}
            aria-label="Dismiss install prompt"
            className="shrink-0 rounded-lg p-1 text-[var(--ds-muted)] transition-colors hover:text-[var(--ds-text)]"
          >
            <AppIcon icon={X} size="xs" className="text-current" />
          </button>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
