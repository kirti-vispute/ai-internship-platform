"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getAuthSession } from "@/lib/session";
import { fetchServerThemePreference, persistThemePreference } from "@/lib/theme/theme-api";
import {
  APPEARANCE_STORAGE_KEY,
  DEFAULT_APPEARANCE,
  DEFAULT_THEME,
  THEMES,
  THEME_STORAGE_KEY,
  isValidAppearance,
  isValidThemeId,
  type Appearance,
  type ThemeId,
  type ThemePalette
} from "@/lib/theme/theme-config";

type ThemeContextValue = {
  theme: ThemeId;
  appearance: Appearance;
  setTheme: (id: ThemeId) => void;
  setAppearance: (mode: Appearance) => void;
  themes: ThemePalette[];
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function applyToDocument(theme: ThemeId, appearance: Appearance) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.setAttribute("data-theme", theme);
  root.setAttribute("data-appearance", appearance);
  root.classList.toggle("dark", appearance === "dark");
}

function readInitial(): { theme: ThemeId; appearance: Appearance } {
  if (typeof document === "undefined") {
    return { theme: DEFAULT_THEME, appearance: DEFAULT_APPEARANCE };
  }
  const root = document.documentElement;
  const docTheme = root.getAttribute("data-theme");
  const docAppearance = root.getAttribute("data-appearance");
  return {
    theme: isValidThemeId(docTheme) ? docTheme : DEFAULT_THEME,
    appearance: isValidAppearance(docAppearance) ? docAppearance : DEFAULT_APPEARANCE
  };
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [{ theme, appearance }, setState] = useState(readInitial);

  // First load on a fresh device for a logged-in user with no local
  // preference yet: pull their saved theme from the server so it follows
  // them across devices, then apply + cache it locally.
  useEffect(() => {
    const hadLocalTheme = typeof window !== "undefined" && !!window.localStorage.getItem(THEME_STORAGE_KEY);
    if (hadLocalTheme || !getAuthSession().loggedIn) return;

    fetchServerThemePreference()
      .then(({ theme: serverTheme, appearance: serverAppearance }) => {
        const nextTheme = isValidThemeId(serverTheme) ? serverTheme : DEFAULT_THEME;
        const nextAppearance = isValidAppearance(serverAppearance) ? serverAppearance : DEFAULT_APPEARANCE;
        setState({ theme: nextTheme, appearance: nextAppearance });
        applyToDocument(nextTheme, nextAppearance);
        window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
        window.localStorage.setItem(APPEARANCE_STORAGE_KEY, nextAppearance);
      })
      .catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const persist = useCallback((nextTheme: ThemeId, nextAppearance: Appearance) => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    window.localStorage.setItem(APPEARANCE_STORAGE_KEY, nextAppearance);
    applyToDocument(nextTheme, nextAppearance);
    if (getAuthSession().loggedIn) {
      persistThemePreference(nextTheme, nextAppearance).catch(() => undefined);
    }
  }, []);

  const setTheme = useCallback(
    (id: ThemeId) => {
      setState((prev) => {
        persist(id, prev.appearance);
        return { theme: id, appearance: prev.appearance };
      });
    },
    [persist]
  );

  const setAppearance = useCallback(
    (mode: Appearance) => {
      setState((prev) => {
        persist(prev.theme, mode);
        return { theme: prev.theme, appearance: mode };
      });
    },
    [persist]
  );

  const value = useMemo(
    () => ({ theme, appearance, setTheme, setAppearance, themes: THEMES }),
    [theme, appearance, setTheme, setAppearance]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
