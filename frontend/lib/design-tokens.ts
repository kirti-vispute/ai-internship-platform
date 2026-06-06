/**
 * Design tokens — mirror CSS variables in platform-design-system.css / homepage.css.
 * Use for programmatic styling only; prefer CSS classes in components.
 */
export const designTokens = {
  text: {
    primary: "#f1f5f9",
    secondary: "#c8d4e0",
    muted: "#b0bec9",
    accent: "#dce8ff"
  },
  surface: {
    primary: "rgba(18, 26, 40, 0.94)",
    raised: "rgba(27, 39, 53, 0.97)"
  },
  button: {
    primary: "#1d4ed8",
    primaryHover: "#2563eb",
    onPrimary: "#ffffff",
    secondary: "rgba(27, 39, 53, 0.95)",
    danger: "#b91c1c",
    success: "#15803d"
  },
  border: {
    default: "rgba(255, 255, 255, 0.12)",
    strong: "rgba(255, 255, 255, 0.18)"
  }
} as const;
