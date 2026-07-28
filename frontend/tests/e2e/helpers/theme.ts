import type { Page } from "@playwright/test";

// Verbatim from lib/theme/palettes.json -- button accessible name is exactly
// this label (the emoji glyph next to it is aria-hidden).
export const PALETTES = [
  { id: "ocean", label: "Ocean Blue" },
  { id: "olive", label: "Olive Green" },
  { id: "crimson", label: "Crimson Red" },
  { id: "golden", label: "Golden Yellow" },
  { id: "sunset", label: "Sunset Orange" },
  { id: "royal", label: "Royal Purple" },
  { id: "rose", label: "Rose Pink" },
  { id: "modern", label: "Modern White" },
  { id: "midnight", label: "Midnight Black" },
  { id: "earth", label: "Earth Brown" }
] as const;

export const APPEARANCES = ["light", "dark"] as const;

export async function readAppliedTheme(page: Page) {
  return page.evaluate(() => ({
    theme: document.documentElement.getAttribute("data-theme"),
    appearance: document.documentElement.getAttribute("data-appearance"),
    isDarkClass: document.documentElement.classList.contains("dark"),
    storedTheme: window.localStorage.getItem("internai.theme"),
    storedAppearance: window.localStorage.getItem("internai.appearance")
  }));
}
