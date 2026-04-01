import { normalizeSkillList, normalizeSkillValue } from "@/lib/skill-normalizer";

const INDUSTRY_TO_ACADEMIC_SKILL_MAP: Record<string, string[]> = {
  react: ["web development", "frontend", "front end", "ui", "javascript"],
  nodejs: ["backend", "back end", "server side", "api", "web development"],
  mongodb: ["database", "nosql", "dbms", "data management", "database systems"],
  html: ["web development", "frontend", "web technologies"],
  css: ["web development", "frontend", "web technologies", "styling"],
  javascript: ["web development", "frontend", "programming", "browser scripting"],
  python: ["programming", "data science", "algorithms"],
  sql: ["database", "dbms", "query processing"],
  "machine learning": ["ai", "modeling", "supervised learning", "unsupervised learning"],
  dbms: ["database", "database management systems", "sql"],
  "database management systems": ["database", "dbms", "sql"]
};

export function getAcademicKeywordsForSkill(skill: string): string[] {
  const canonicalSkill = normalizeSkillValue(skill);
  if (!canonicalSkill) return [];

  const mappedKeywords = INDUSTRY_TO_ACADEMIC_SKILL_MAP[canonicalSkill] || [];
  return normalizeSkillList([canonicalSkill, ...mappedKeywords]);
}

export function getAcademicKeywordsForSkills(skills: string[]): Record<string, string[]> {
  const normalizedSkills = normalizeSkillList(skills);
  const skillKeywordMap: Record<string, string[]> = {};

  for (const skill of normalizedSkills) {
    skillKeywordMap[skill] = getAcademicKeywordsForSkill(skill);
  }

  return skillKeywordMap;
}
