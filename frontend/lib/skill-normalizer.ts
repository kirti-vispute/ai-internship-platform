const SKILL_ALIAS_MAP: Record<string, string> = {
  js: "javascript",
  javascript: "javascript",
  ts: "typescript",
  typescript: "typescript",
  "node.js": "nodejs",
  "node js": "nodejs",
  nodejs: "nodejs",
  node: "nodejs",
  ml: "machine learning",
  "machine-learning": "machine learning",
  "machine learning": "machine learning"
};

const DISPLAY_SKILL_MAP: Record<string, string> = {
  javascript: "JavaScript",
  typescript: "TypeScript",
  nodejs: "NodeJS",
  html: "HTML",
  css: "CSS",
  sql: "SQL",
  mongodb: "MongoDB",
  "machine learning": "Machine Learning"
};

export function normalizeSkillValue(skill: unknown): string {
  if (typeof skill !== "string" && typeof skill !== "number") return "";

  const raw = String(skill)
    .toLowerCase()
    .replace(/[._-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!raw) return "";
  return SKILL_ALIAS_MAP[raw] || raw;
}

export function normalizeSkillList(skills: unknown): string[] {
  if (!Array.isArray(skills)) return [];

  const set = new Set<string>();
  for (const skill of skills) {
    const normalized = normalizeSkillValue(skill);
    if (normalized) set.add(normalized);
  }

  return [...set];
}

export function toDisplaySkill(skill: unknown): string {
  const normalized = normalizeSkillValue(skill);
  if (!normalized) return "";

  if (DISPLAY_SKILL_MAP[normalized]) {
    return DISPLAY_SKILL_MAP[normalized];
  }

  return normalized
    .split(" ")
    .filter(Boolean)
    .map((token) => token.charAt(0).toUpperCase() + token.slice(1))
    .join(" ");
}

export function toDisplaySkillList(skills: unknown): string[] {
  return normalizeSkillList(skills).map(toDisplaySkill);
}
