import { VERIFIED_COURSES, VerifiedCourse } from "@/lib/courses-dataset";
import { normalizeSkillList, normalizeSkillValue, toDisplaySkill } from "@/lib/skill-normalizer";

export type RankedCourseSuggestion = {
  id: string;
  title: string;
  platform: "NPTEL" | "Coursera";
  url: string;
  description: string;
  targetSkills: string[];
  similarityScore: number;
};

const NPTEL_HOSTS = new Set(["onlinecourses.nptel.ac.in", "onlinecourses-archive.nptel.ac.in"]);
const COURSERA_HOSTS = new Set(["www.coursera.org", "coursera.org"]);

const TOKEN_ALIAS_MAP: Record<string, string> = {
  js: "javascript",
  "node.js": "nodejs",
  "node js": "nodejs",
  ml: "machine learning"
};

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

export function buildCourseDocument(course: VerifiedCourse): string {
  return [course.title, course.description, ...(course.tags || [])].join(" ");
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
    return NPTEL_HOSTS.has(parsed.hostname) || COURSERA_HOSTS.has(parsed.hostname);
  } catch {
    return false;
  }
}

function normalizeCourseTagSkills(tags: string[]): string[] {
  return normalizeSkillList(tags);
}

export function computeTfIdfScores(queryText: string, courses: VerifiedCourse[]) {
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
      score: cosineSimilarity(queryVector, docVector),
      tokens: courseTokens[index]
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

  const verifiedCourses = VERIFIED_COURSES.filter((course) => course.verified && isVerifiedDirectCourseUrl(course.url));
  const queryText = normalizedMissingSkills.join(" ");

  const scoredCourses = computeTfIdfScores(queryText, verifiedCourses)
    .map((item) => {
      const normalizedTags = normalizeCourseTagSkills(item.course.tags || []);
      const matchedCanonical = normalizedMissingSkills.filter((skill) => normalizedTags.includes(normalizeSkillValue(skill)));

      return {
        ...item,
        matchedCanonical
      };
    })
    .filter((item) => item.matchedCanonical.length > 0 && item.score > 0);

  scoredCourses.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (b.matchedCanonical.length !== a.matchedCanonical.length) return b.matchedCanonical.length - a.matchedCanonical.length;
    return a.course.title.localeCompare(b.course.title);
  });

  const courseByUrl = new Map<string, RankedCourseSuggestion>();
  for (const item of scoredCourses) {
    const displaySkills = item.matchedCanonical.map((skill) => toDisplaySkill(skill));
    const existing = courseByUrl.get(item.course.url);
    if (existing) {
      const merged = new Set([...existing.targetSkills, ...displaySkills]);
      existing.targetSkills = [...merged];
      existing.similarityScore = Math.max(existing.similarityScore, item.score);
      continue;
    }

    courseByUrl.set(item.course.url, {
      id: item.course.id,
      title: item.course.title,
      platform: item.course.platform,
      url: item.course.url,
      description: item.course.description,
      targetSkills: displaySkills,
      similarityScore: item.score
    });
  }

  const suggestions = [...courseByUrl.values()].slice(0, 6);
  const covered = new Set(
    suggestions
      .flatMap((item) => item.targetSkills)
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
