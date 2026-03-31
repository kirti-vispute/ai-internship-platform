const { canonicalSkill, displaySkill } = require("./resume-structured-parser.service");

const SKILL_ALIAS_MAP = {
  js: "javascript",
  javascript: "javascript",
  ts: "typescript",
  typescript: "typescript",
  nodejs: "node.js",
  "node js": "node.js",
  node: "node.js",
  reactjs: "react",
  react: "react",
  mongo: "mongodb",
  mongodb: "mongodb",
  ml: "machine learning",
  ai: "artificial intelligence",
  sql: "sql",
  html: "html",
  css: "css"
};

function normalizeSkillToken(skill) {
  const raw = String(skill || "").trim().toLowerCase();
  if (!raw) return "";

  const canonical = canonicalSkill(raw);
  if (canonical) {
    return SKILL_ALIAS_MAP[canonical] || canonical;
  }

  return SKILL_ALIAS_MAP[raw] || raw;
}

function normalizeSkills(skills = []) {
  if (!Array.isArray(skills)) return [];
  const normalized = skills.map(normalizeSkillToken).filter(Boolean);
  return [...new Set(normalized)];
}

function unique(items = []) {
  return [...new Set(items)];
}

const STOP_WORDS = new Set([
  "a", "an", "the", "and", "or", "to", "for", "of", "in", "on", "at", "by", "with", "as", "is", "are", "was",
  "were", "be", "been", "being", "this", "that", "these", "those", "from", "it", "its", "into", "about", "over",
  "under", "than", "then", "also", "can", "could", "should", "would", "will", "may", "might", "do", "does", "did"
]);

function cleanResumeText(text = "") {
  return String(text)
    .replace(/http\S+\s*/g, " ")
    .replace(/RT|cc/g, " ")
    .replace(/#\S+/g, " ")
    .replace(/@\S+/g, " ")
    .replace(/[!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~]/g, " ")
    .replace(/[^\x00-\x7F]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function preprocessText(text = "") {
  const cleaned = cleanResumeText(text);
  return cleaned
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token && /^[a-z]+$/.test(token) && !STOP_WORDS.has(token));
}

function termFrequency(tokens = []) {
  const map = new Map();
  for (const token of tokens) {
    map.set(token, (map.get(token) || 0) + 1);
  }
  return map;
}

function cosineSimilarity(tokensA = [], tokensB = []) {
  const tfA = termFrequency(tokensA);
  const tfB = termFrequency(tokensB);

  const allTerms = new Set([...tfA.keys(), ...tfB.keys()]);
  let dot = 0;
  let magA = 0;
  let magB = 0;

  for (const term of allTerms) {
    const a = tfA.get(term) || 0;
    const b = tfB.get(term) || 0;
    dot += a * b;
    magA += a * a;
    magB += b * b;
  }

  if (magA === 0 || magB === 0) return 0;
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

/**
 * JS adaptation of sieve.ai `find_score` logic:
 * cosine similarity between processed resume and JD + custom keywords.
 */
function findScoreLikeSieve(jobDescription = "", resumeText = "", customKeywords = []) {
  const jdText = `${jobDescription || ""} ${customKeywords.join(" ")}`.trim();
  const resumeTokens = preprocessText(resumeText);
  const jdTokens = preprocessText(jdText);
  return Math.round(cosineSimilarity(resumeTokens, jdTokens) * 10000) / 100;
}

function parseResumeText(text = "") {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);

  const skillKeywords = ["javascript", "typescript", "node", "react", "python", "sql", "mongodb", "machine learning", "data analysis", "excel"];
  const foundSkills = skillKeywords.filter((skill) => text.toLowerCase().includes(skill));

  const education = lines.filter((line) => /b\.tech|btech|m\.tech|mtech|bca|mca|degree|university|college/i.test(line));
  const projects = lines.filter((line) => /project|built|developed|implemented/i.test(line));
  const certifications = lines.filter((line) => /certified|certificate|coursera|udemy|nptel/i.test(line));

  // Replace this deterministic parser with Gemini/OpenAI extraction for richer structured resume parsing.
  return {
    skills: unique(foundSkills),
    education: unique(education).slice(0, 5),
    projects: unique(projects).slice(0, 6),
    certifications: unique(certifications).slice(0, 6)
  };
}

function calculateResumeScore(profile) {
  const skills = profile.skills || [];
  const projects = profile.projects || [];
  const certifications = profile.certifications || [];
  const education = profile.education || [];
  const resumeText = profile.resume?.text || "";

  const benchmarkJobDescription = [
    "software engineering internship project experience problem solving communication teamwork",
    ...skills,
    ...projects,
    ...certifications,
    ...education
  ].join(" ");

  // Inspired by sieve.ai scoring approach.
  const similarityScore = findScoreLikeSieve(benchmarkJobDescription, resumeText, skills);

  const skillsStrength = Math.min(skills.length * 8, 100);
  const projectsStrength = Math.min(projects.length * 15, 100);
  const certStrength = Math.min(certifications.length * 12, 100);
  const educationStrength = education.length > 0 ? 100 : 0;
  const structureStrength = resumeText.length > 300 ? 100 : resumeText.length > 100 ? 60 : 20;

  const weighted =
    similarityScore * 0.5 +
    skillsStrength * 0.15 +
    projectsStrength * 0.15 +
    certStrength * 0.1 +
    educationStrength * 0.05 +
    structureStrength * 0.05;

  return Math.max(0, Math.min(100, Math.round(weighted)));
}

function getSkillGap(internSkills = [], requiredSkills = []) {
  const normalizedIntern = normalizeSkills(internSkills);
  const normalizedRequired = normalizeSkills(requiredSkills);

  const internSet = new Set(normalizedIntern);
  const matchedCanonical = normalizedRequired.filter((skill) => internSet.has(skill));
  const missingCanonical = normalizedRequired.filter((skill) => !internSet.has(skill));
  const matchPercent = normalizedRequired.length ? Math.round((matchedCanonical.length / normalizedRequired.length) * 100) : 0;

  return {
    matched: matchedCanonical.map(displaySkill),
    missing: missingCanonical.map(displaySkill),
    matchPercent
  };
}

function getParsedResumeSkills(internProfile = {}) {
  const parsedSkills = internProfile?.resume?.parsed?.skills;
  return normalizeSkills(Array.isArray(parsedSkills) ? parsedSkills : []);
}

function recommendInternships(internProfile, internships = [], options = {}) {
  const internSkills = normalizeSkills(options.internSkills || getParsedResumeSkills(internProfile));
  if (internSkills.length === 0) {
    return [];
  }

  const ranked = internships.map((internship) => {
    const requiredSkills = normalizeSkills(internship?.skillsRequired || []);
    const skillGap = getSkillGap(internSkills, requiredSkills);
    const skillMatchPercent = requiredSkills.length ? skillGap.matchPercent : 0;

    if (process.env.RECOMMENDATION_DEBUG === "true") {
      // eslint-disable-next-line no-console
      console.log(
        "[recommendation-debug]",
        JSON.stringify({
          internshipId: internship?._id,
          internshipRole: internship?.role || "",
          internSkills,
          requiredSkills,
          matchedSkills: skillGap.matched,
          missingSkills: skillGap.missing,
          finalScore: skillMatchPercent
        })
      );
    }

    return {
      internship,
      skillMatchPercent,
      recommendationScore: skillMatchPercent,
      skillGap
    };
  });

  return ranked.sort((a, b) => {
    if (b.skillMatchPercent !== a.skillMatchPercent) {
      return b.skillMatchPercent - a.skillMatchPercent;
    }
    return String(a.internship?.role || "").localeCompare(String(b.internship?.role || ""));
  });
}

function rankApplicantsForInternship(internship, applicantProfiles = []) {
  return applicantProfiles
    .map((profile) => {
      const resumeScore = calculateResumeScore(profile);
      const skillGap = getSkillGap(profile.skills, internship.skillsRequired || []);
      const finalScore = Math.round(skillGap.matchPercent * 0.7 + resumeScore * 0.3);

      return {
        profile,
        skillGap,
        score: Math.min(100, finalScore)
      };
    })
    .sort((a, b) => b.score - a.score);
}

module.exports = {
  parseResumeText,
  calculateResumeScore,
  getSkillGap,
  recommendInternships,
  rankApplicantsForInternship
};
