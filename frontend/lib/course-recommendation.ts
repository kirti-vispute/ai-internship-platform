import { NptelCourse, VERIFIED_NPTEL_COURSES } from "@/lib/courses-dataset";
import { normalizeSkillList, normalizeSkillValue, toDisplaySkill } from "@/lib/skill-normalizer";

export type RankedCourseSuggestion = {
  id: string;
  title: string;
  platform: "NPTEL";
  url: string;
  description: string;
  targetSkills: string[];
  similarityScore: number;
};

type RelevanceEvaluation = {
  tier: 0 | 1 | 2 | 3;
  weightedSignalScore: number;
  titleSignal: boolean;
  tagSignal: boolean;
  descriptionSignal: boolean;
};

const NPTEL_HOSTS = new Set(["onlinecourses.nptel.ac.in", "onlinecourses-archive.nptel.ac.in"]);

const TOKEN_ALIAS_MAP: Record<string, string> = {
  js: "javascript",
  "node.js": "nodejs",
  "node js": "nodejs",
  ml: "machine learning",
  dbms: "database management systems"
};

const SKILL_ALIAS_CANDIDATES: Record<string, string[]> = {
  javascript: ["js"],
  nodejs: ["node js", "node.js"],
  "machine learning": ["ml"],
  "database management systems": ["dbms", "database systems", "database management system"]
};

const SKILL_SIGNAL_SUPPORT: Record<string, string[]> = {
  html: ["web development", "frontend"],
  css: ["web development", "frontend"],
  javascript: ["web development", "frontend", "browser"],
  sql: ["database", "dbms", "query"],
  python: ["programming", "data science"],
  "machine learning": ["modeling", "supervised", "unsupervised"],
  "data structures": ["algorithms"],
  dbms: ["database", "sql"],
  "database management systems": ["database", "sql", "dbms"]
};

function clamp(value: number, min = 0, max = 1): number {
  return Math.max(min, Math.min(max, value));
}

export function normalizeText(input: string): string {
  return input
    .toLowerCase()
    .replace(/[._-]+/g, " ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function canonicalizeToken(token: string): string {
  const normalized = normalizeText(token);
  if (!normalized) return "";
  return TOKEN_ALIAS_MAP[normalized] || normalized;
}

function tokenize(text: string): string[] {
  return normalizeText(text)
    .split(" ")
    .map((token) => canonicalizeToken(token))
    .filter(Boolean);
}

function containsTerm(haystack: string, term: string): boolean {
  if (!haystack || !term) return false;
  const normalizedHaystack = ` ${normalizeText(haystack)} `;
  const normalizedTerm = ` ${normalizeText(term)} `;
  return normalizedHaystack.includes(normalizedTerm);
}

function countTermHits(haystack: string, terms: Iterable<string>): number {
  let hits = 0;
  for (const term of terms) {
    if (containsTerm(haystack, term)) hits += 1;
  }
  return hits;
}

function getAliasCandidates(skill: string): string[] {
  const canonical = normalizeSkillValue(skill);
  if (!canonical) return [];

  const aliases = SKILL_ALIAS_CANDIDATES[canonical] || [];
  return normalizeSkillList([canonical, ...aliases]);
}

function getSignalTerms(skill: string): string[] {
  const canonical = normalizeSkillValue(skill);
  const aliases = getAliasCandidates(canonical);
  const supports = SKILL_SIGNAL_SUPPORT[canonical] || [];
  return normalizeSkillList([...aliases, ...supports]);
}

export function buildCourseDocument(course: NptelCourse): string {
  return [course.title, course.description, ...(course.tags || []), ...(course.skillCoverage || []), ...(course.relevanceGroup || [])].join(" ");
}

function termFrequency(tokens: string[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const token of tokens) counts.set(token, (counts.get(token) || 0) + 1);
  const total = tokens.length || 1;

  const tf = new Map<string, number>();
  for (const [token, count] of counts.entries()) {
    tf.set(token, count / total);
  }
  return tf;
}

function inverseDocumentFrequency(documents: string[][]): Map<string, number> {
  const df = new Map<string, number>();
  for (const tokens of documents) {
    const unique = new Set(tokens);
    for (const token of unique) {
      df.set(token, (df.get(token) || 0) + 1);
    }
  }

  const totalDocs = documents.length || 1;
  const idf = new Map<string, number>();
  for (const [token, count] of df.entries()) {
    idf.set(token, Math.log((totalDocs + 1) / (count + 1)) + 1);
  }
  return idf;
}

function cosineSimilarity(a: Map<string, number>, b: Map<string, number>): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (const value of a.values()) normA += value * value;
  for (const value of b.values()) normB += value * value;

  for (const [token, valueA] of a.entries()) {
    dot += valueA * (b.get(token) || 0);
  }

  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

function isVerifiedDirectCourseUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return false;
    return NPTEL_HOSTS.has(parsed.hostname);
  } catch {
    return false;
  }
}

function normalizeCourseIndex(course: NptelCourse) {
  return {
    coverage: normalizeSkillList(course.skillCoverage),
    tags: normalizeSkillList([...(course.tags || []), ...(course.relevanceGroup || [])]),
    title: normalizeText(course.title),
    description: normalizeText(course.description)
  };
}

function assessCourseRelevance(skill: string, course: NptelCourse): RelevanceEvaluation {
  const canonicalSkill = normalizeSkillValue(skill);
  if (!canonicalSkill) {
    return { tier: 0, weightedSignalScore: 0, titleSignal: false, tagSignal: false, descriptionSignal: false };
  }

  const index = normalizeCourseIndex(course);
  const aliasCandidates = getAliasCandidates(canonicalSkill).filter((alias) => alias !== canonicalSkill);

  const exactCoverage = index.coverage.includes(canonicalSkill) || index.tags.includes(canonicalSkill);
  const aliasCoverage = !exactCoverage && aliasCandidates.some((alias) => index.coverage.includes(alias) || index.tags.includes(alias));

  if (exactCoverage) {
    return { tier: 3, weightedSignalScore: 1, titleSignal: true, tagSignal: true, descriptionSignal: true };
  }

  if (aliasCoverage) {
    return { tier: 2, weightedSignalScore: 0.85, titleSignal: true, tagSignal: true, descriptionSignal: false };
  }

  const signalTerms = getSignalTerms(canonicalSkill);
  const titleSignal = signalTerms.some((term) => containsTerm(index.title, term));
  const tagSignal = signalTerms.some((term) => index.tags.includes(term));
  const descriptionHits = countTermHits(index.description, signalTerms);
  const descriptionSignal = descriptionHits >= 2 || containsTerm(index.description, canonicalSkill);

  const signalCount = Number(titleSignal) + Number(tagSignal) + Number(descriptionSignal);
  const weightedSignalScore =
    (titleSignal ? 1.2 : 0) +
    (tagSignal ? 1 : 0) +
    (descriptionSignal ? 0.8 : 0) +
    Math.min(descriptionHits, 3) * 0.1;

  const strongMultiSignal = signalCount >= 2 && weightedSignalScore >= 2.2;
  if (!strongMultiSignal) {
    return { tier: 0, weightedSignalScore, titleSignal, tagSignal, descriptionSignal };
  }

  return { tier: 1, weightedSignalScore, titleSignal, tagSignal, descriptionSignal };
}

export function computeTfIdfScores(queryText: string, courses: NptelCourse[]) {
  const queryTokens = tokenize(queryText);
  const courseTokens = courses.map((course) => tokenize(buildCourseDocument(course)));
  const idf = inverseDocumentFrequency([...courseTokens, queryTokens]);

  const queryTf = termFrequency(queryTokens);
  const queryVector = new Map<string, number>();
  for (const [token, tf] of queryTf.entries()) {
    queryVector.set(token, tf * (idf.get(token) || 0));
  }

  return courses.map((course, index) => {
    const docTf = termFrequency(courseTokens[index]);
    const docVector = new Map<string, number>();

    for (const [token, tf] of docTf.entries()) {
      docVector.set(token, tf * (idf.get(token) || 0));
    }

    return {
      course,
      score: cosineSimilarity(queryVector, docVector)
    };
  });
}

export function getSuggestedCoursesForMissingSkills(missingSkills: string[]) {
  const normalizedMissingSkills = normalizeSkillList(missingSkills);

  if (normalizedMissingSkills.length === 0) {
    return {
      queryText: "",
      suggestions: [] as RankedCourseSuggestion[],
      unmappedSkills: [] as string[]
    };
  }

  const verifiedCourses = VERIFIED_NPTEL_COURSES.filter(
    (course) => course.verified && course.provider === "NPTEL" && isVerifiedDirectCourseUrl(course.url)
  );
  const queryText = normalizedMissingSkills.join(" ");

  const tfidfById = new Map(computeTfIdfScores(queryText, verifiedCourses).map((entry) => [entry.course.id, entry.score]));

  const qualified: Array<{
    skill: string;
    course: NptelCourse;
    tier: 1 | 2 | 3;
    weightedSignalScore: number;
    similarityScore: number;
  }> = [];

  for (const skill of normalizedMissingSkills) {
    for (const course of verifiedCourses) {
      const relevance = assessCourseRelevance(skill, course);
      if (relevance.tier === 0) continue;

      const tfidfScore = tfidfById.get(course.id) || 0;
      const blendedScore = clamp(relevance.tier * 0.45 + relevance.weightedSignalScore * 0.2 + tfidfScore * 0.35);

      qualified.push({
        skill,
        course,
        tier: relevance.tier,
        weightedSignalScore: relevance.weightedSignalScore,
        similarityScore: blendedScore
      });
    }
  }

  const selected: typeof qualified = [];
  for (const skill of normalizedMissingSkills) {
    const perSkill = qualified
      .filter((item) => item.skill === skill)
      .sort((a, b) => {
        if (b.tier !== a.tier) return b.tier - a.tier;
        if (b.weightedSignalScore !== a.weightedSignalScore) return b.weightedSignalScore - a.weightedSignalScore;
        if (b.similarityScore !== a.similarityScore) return b.similarityScore - a.similarityScore;
        return a.course.title.localeCompare(b.course.title);
      })
      .slice(0, 2);

    selected.push(...perSkill);
  }

  const courseByUrl = new Map<string, RankedCourseSuggestion>();
  for (const item of selected) {
    const displaySkill = toDisplaySkill(item.skill);
    const existing = courseByUrl.get(item.course.url);
    if (existing) {
      const merged = new Set([...existing.targetSkills, displaySkill]);
      existing.targetSkills = [...merged];
      existing.similarityScore = Math.max(existing.similarityScore, item.similarityScore);
      continue;
    }

    courseByUrl.set(item.course.url, {
      id: item.course.id,
      title: item.course.title,
      platform: "NPTEL",
      url: item.course.url,
      description: item.course.description,
      targetSkills: [displaySkill],
      similarityScore: item.similarityScore
    });
  }

  const suggestions = [...courseByUrl.values()]
    .sort((a, b) => {
      if (b.similarityScore !== a.similarityScore) return b.similarityScore - a.similarityScore;
      return a.title.localeCompare(b.title);
    })
    .slice(0, 6);

  const covered = new Set(
    selected
      .map((item) => item.skill)
      .map((skill) => normalizeSkillValue(skill))
      .filter(Boolean)
  );

  const unmappedSkills = normalizedMissingSkills
    .filter((skill) => !covered.has(skill))
    .map((skill) => toDisplaySkill(skill));

  return {
    queryText,
    suggestions,
    unmappedSkills
  };
}
