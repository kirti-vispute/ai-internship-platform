const SKILL_ALIAS_MAP = {
  js: "javascript",
  javascript: "javascript",
  ts: "typescript",
  typescript: "typescript",
  "node js": "nodejs",
  "node.js": "nodejs",
  nodejs: "nodejs",
  node: "nodejs",
  reactjs: "react",
  "react js": "react",
  react: "react",
  "mongo db": "mongodb",
  mongo: "mongodb",
  mongodb: "mongodb",
  ml: "machine learning",
  "machine-learning": "machine learning",
  "machine learning": "machine learning"
};

const DISPLAY_SKILL_MAP = {
  javascript: "JavaScript",
  typescript: "TypeScript",
  nodejs: "NodeJS",
  react: "React",
  "machine learning": "Machine Learning",
  html: "HTML",
  css: "CSS",
  sql: "SQL",
  mongodb: "MongoDB"
};

function normalizeSkillValue(skill) {
  if (skill === null || skill === undefined) return "";

  const raw = String(skill)
    .toLowerCase()
    .replace(/[._-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!raw) return "";
  return SKILL_ALIAS_MAP[raw] || raw;
}

function normalizeSkillList(skills = []) {
  if (!Array.isArray(skills)) return [];

  const set = new Set();
  for (const skill of skills) {
    const normalized = normalizeSkillValue(skill);
    if (normalized) {
      set.add(normalized);
    }
  }

  return [...set];
}

function toDisplaySkill(skill) {
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

function toDisplaySkillList(skills = []) {
  return normalizeSkillList(skills).map(toDisplaySkill);
}

module.exports = {
  normalizeSkillValue,
  normalizeSkillList,
  toDisplaySkill,
  toDisplaySkillList
};

