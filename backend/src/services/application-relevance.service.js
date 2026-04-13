const { computeSkillMatch } = require("../utils/compute-skill-match");
const { normalizeSkillList } = require("../utils/skill-normalizer");

const STOP_WORDS = new Set([
  "a", "an", "the", "and", "or", "to", "for", "of", "in", "on", "at", "by", "with", "as", "is", "are", "was",
  "were", "be", "been", "being", "this", "that", "these", "those", "from", "it", "its", "into", "about", "over",
  "under", "than", "then", "also", "can", "could", "should", "would", "will", "may", "might", "do", "does", "did",
  "your", "you", "we", "our", "they", "their", "he", "she", "his", "her", "them", "i", "me", "my", "mine", "us",
  "using", "used", "use", "across", "through", "while", "where", "when", "who", "how", "what", "which"
]);

const TOKEN_ALIAS_MAP = {
  js: "javascript",
  ts: "typescript",
  "node.js": "nodejs",
  "node js": "nodejs",
  node: "nodejs",
  ml: "machine learning",
  mongo: "mongodb",
  "mongo db": "mongodb"
};

const EDUCATION_KEYWORDS = [
  "btech",
  "b e",
  "be",
  "bca",
  "mca",
  "bsc",
  "msc",
  "bachelor",
  "master",
  "degree",
  "diploma",
  "engineering",
  "computer science",
  "information technology"
];

function unique(values = []) {
  return [...new Set(values)];
}

function normalizeText(value = "") {
  return String(value)
    .toLowerCase()
    .replace(/[._-]+/g, " ")
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeToken(token = "") {
  const normalized = normalizeText(token);
  if (!normalized || STOP_WORDS.has(normalized)) return "";
  return TOKEN_ALIAS_MAP[normalized] || normalized;
}

function tokenizeText(input = "") {
  const normalized = normalizeText(input);
  if (!normalized) return [];

  return normalized
    .split(" ")
    .map((token) => normalizeToken(token))
    .filter((token) => Boolean(token) && token.length > 1);
}

function listToText(values = []) {
  if (!Array.isArray(values)) return "";
  return values
    .map((item) => {
      if (typeof item === "string" || typeof item === "number") return String(item);
      if (item && typeof item === "object") return JSON.stringify(item);
      return "";
    })
    .filter(Boolean)
    .join(" ");
}

function toSet(values = []) {
  return new Set(values.filter(Boolean));
}

function overlapPercent(targetSet = new Set(), sourceSet = new Set()) {
  if (targetSet.size === 0) return 0;
  if (sourceSet.size === 0) return 0;

  let matched = 0;
  for (const token of targetSet) {
    if (sourceSet.has(token)) matched += 1;
  }
  return Math.round((matched / targetSet.size) * 100);
}

function collectInternSkills(profile = {}) {
  return normalizeSkillList([
    ...(Array.isArray(profile.skills) ? profile.skills : []),
    ...(Array.isArray(profile?.resume?.parsed?.skills) ? profile.resume.parsed.skills : [])
  ]);
}

function collectInternKeywordSet(profile = {}) {
  const parsed = profile?.resume?.parsed || {};
  const textBlob = [
    profile?.resume?.text || "",
    profile.summary || "",
    listToText(profile.skills),
    listToText(profile.projects),
    listToText(profile.experience),
    listToText(profile.education),
    listToText(parsed.skills),
    listToText(parsed.projects),
    listToText(parsed.experience),
    listToText(parsed.education),
    listToText(parsed.certifications),
    listToText(parsed.achievements)
  ].join(" ");

  return toSet(unique(tokenizeText(textBlob)));
}

function collectInternEducationSet(profile = {}) {
  const parsedEducation = Array.isArray(profile?.resume?.parsed?.education) ? profile.resume.parsed.education : [];
  const parsedText = parsedEducation
    .map((item) => [item?.degree, item?.institution, item?.raw].filter(Boolean).join(" "))
    .join(" ");
  const source = `${listToText(profile.education)} ${parsedText}`.trim();
  return toSet(unique(tokenizeText(source)));
}

function collectInternProjectExperienceSet(profile = {}) {
  const parsedProjects = Array.isArray(profile?.resume?.parsed?.projects) ? profile.resume.parsed.projects : [];
  const parsedExperience = Array.isArray(profile?.resume?.parsed?.experience) ? profile.resume.parsed.experience : [];

  const parsedProjectText = parsedProjects
    .map((item) => [item?.title, listToText(item?.techStack), item?.description].filter(Boolean).join(" "))
    .join(" ");
  const parsedExperienceText = parsedExperience
    .map((item) => [item?.role, item?.company, item?.description].filter(Boolean).join(" "))
    .join(" ");

  const source = `${listToText(profile.projects)} ${listToText(profile.experience)} ${parsedProjectText} ${parsedExperienceText}`.trim();
  return toSet(unique(tokenizeText(source)));
}

function collectInternshipKeywordSet(internship = {}, requiredSkills = [], preferredSkills = []) {
  const textBlob = [
    internship.role || "",
    internship.description || "",
    internship.location || "",
    internship.duration || "",
    listToText(requiredSkills),
    listToText(preferredSkills)
  ].join(" ");

  const tokens = tokenizeText(textBlob);
  const canonicalSkills = normalizeSkillList([...requiredSkills, ...preferredSkills]);
  return toSet(unique([...tokens, ...canonicalSkills]));
}

function extractEducationRequirements(internshipKeywordSet = new Set()) {
  const required = [];
  for (const keyword of EDUCATION_KEYWORDS) {
    const normalized = normalizeText(keyword);
    if (normalized && internshipKeywordSet.has(normalized)) {
      required.push(normalized);
    }
  }
  return toSet(required);
}

function computeApplicationRelevance(profile = {}, internship = {}) {
  const requiredSkills = normalizeSkillList(internship.skillsRequired || []);
  const preferredSkills = normalizeSkillList(internship.prioritySkills || []);
  const internSkills = collectInternSkills(profile);

  const skillMatch = computeSkillMatch(internSkills, requiredSkills, preferredSkills);
  const internshipKeywordSet = collectInternshipKeywordSet(internship, requiredSkills, preferredSkills);
  const internKeywordSet = collectInternKeywordSet(profile);
  const internEducationSet = collectInternEducationSet(profile);
  const internProjectExperienceSet = collectInternProjectExperienceSet(profile);

  const educationRequirements = extractEducationRequirements(internshipKeywordSet);
  const projectExperienceTargets = toSet([
    ...requiredSkills,
    ...preferredSkills,
    ...Array.from(internshipKeywordSet).slice(0, 20)
  ]);

  const skillsScore = skillMatch.overallScore;
  const resumeKeywordScore = overlapPercent(internshipKeywordSet, internKeywordSet);
  const educationScore = overlapPercent(educationRequirements, internEducationSet);
  const projectExperienceScore = overlapPercent(projectExperienceTargets, internProjectExperienceSet);

  const weightedComponents = [{ key: "skills", weight: 60, score: skillsScore }];

  if (internshipKeywordSet.size > 0 && internKeywordSet.size > 0) {
    weightedComponents.push({ key: "resumeKeywords", weight: 20, score: resumeKeywordScore });
  }
  if (educationRequirements.size > 0) {
    weightedComponents.push({ key: "education", weight: 10, score: educationScore });
  }
  if (projectExperienceTargets.size > 0 && internProjectExperienceSet.size > 0) {
    weightedComponents.push({ key: "projectExperience", weight: 10, score: projectExperienceScore });
  }

  const weightTotal = weightedComponents.reduce((sum, component) => sum + component.weight, 0);
  const weightedSum = weightedComponents.reduce(
    (sum, component) => sum + component.score * component.weight,
    0
  );
  const relevanceScore = weightTotal > 0 ? Math.round(weightedSum / weightTotal) : skillsScore;

  return {
    relevanceScore,
    requiredSkillMatchPercent: skillMatch.requiredMatchPercent,
    preferredSkillMatchPercent: skillMatch.preferredMatchPercent,
    overallSkillScore: skillMatch.overallScore,
    matchedRequiredSkills: skillMatch.matchedRequiredSkills,
    missingRequiredSkills: skillMatch.missingRequiredSkills,
    weightedComponents,
    debug: {
      normalizedInternSkills: skillMatch.normalizedInternSkills,
      normalizedRequiredSkills: skillMatch.normalizedRequiredSkills,
      normalizedPreferredSkills: skillMatch.normalizedPreferredSkills,
      internshipKeywords: Array.from(internshipKeywordSet),
      internResumeKeywords: Array.from(internKeywordSet),
      educationRequirements: Array.from(educationRequirements),
      internEducationKeywords: Array.from(internEducationSet),
      projectExperienceTargets: Array.from(projectExperienceTargets),
      internProjectExperienceKeywords: Array.from(internProjectExperienceSet)
    }
  };
}

module.exports = {
  computeApplicationRelevance
};

