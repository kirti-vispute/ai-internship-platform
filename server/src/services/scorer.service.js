const { calculateResumeScore } = require("./ai.service");

const SCORER_ENABLED = String(process.env.SCORER_ENABLED || "false").toLowerCase() === "true";
const SCORER_BASE_URL = process.env.SCORER_BASE_URL || "http://localhost:5002";
const SCORER_TIMEOUT_MS = Number(process.env.SCORER_TIMEOUT_MS || 5000);
const SCORER_MAX_RETRIES = 2;

const ACTION_VERBS = [
  "built", "developed", "implemented", "optimized", "designed", "led", "created", "improved", "managed", "delivered"
];

const SECTION_HINTS = ["summary", "experience", "education", "skills", "projects", "certification"];

function normalizeScore(value) {
  const num = Number(value);
  if (Number.isNaN(num)) return null;
  return Math.max(0, Math.min(100, Math.round(num)));
}

function cleanText(text = "") {
  return String(text)
    .replace(/\r/g, "\n")
    .replace(/\t/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function countRegex(text, regex) {
  const matches = text.match(regex);
  return matches ? matches.length : 0;
}

function toPercent(numerator, denominator) {
  if (!denominator) return 0;
  return Math.max(0, Math.min(100, Math.round((numerator / denominator) * 100)));
}

function analyzeResumeText(text, targetSkills = []) {
  const clean = cleanText(text).toLowerCase();
  const words = clean.split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  const hasEmail = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i.test(clean);
  const hasPhone = /(?:\+?\d{1,3}[\s-]?)?(?:\d[\s-]?){10,12}/.test(clean);
  const hasLinkedIn = /linkedin\.com\//i.test(clean);

  const sectionCount = SECTION_HINTS.filter((section) => clean.includes(section)).length;
  const sectionScore = toPercent(sectionCount, SECTION_HINTS.length);

  let lengthScore = 0;
  if (wordCount >= 350 && wordCount <= 900) lengthScore = 100;
  else if (wordCount >= 250 && wordCount < 350) lengthScore = 75;
  else if (wordCount > 900 && wordCount <= 1200) lengthScore = 70;
  else if (wordCount >= 150 && wordCount < 250) lengthScore = 50;
  else lengthScore = 30;

  const quantCount = countRegex(clean, /(\d+%|\$\d+|\d+\+|\d+\s?(users|clients|projects|months|years))/gi);
  const quantScore = Math.min(100, quantCount * 18);

  const verbCount = ACTION_VERBS.reduce((acc, verb) => acc + countRegex(clean, new RegExp(`\\b${verb}\\b`, "gi")), 0);
  const verbScore = Math.min(100, verbCount * 15);

  const normalizedSkills = targetSkills.map((skill) => String(skill).toLowerCase().trim()).filter(Boolean);
  const matchedSkills = normalizedSkills.filter((skill) => clean.includes(skill));
  const skillsScore = normalizedSkills.length > 0 ? toPercent(matchedSkills.length, normalizedSkills.length) : 60;

  const atsScore = Math.round((hasEmail ? 30 : 0) + (hasPhone ? 25 : 0) + (hasLinkedIn ? 15 : 0) + sectionScore * 0.3);
  const contentScore = Math.round(lengthScore * 0.5 + sectionScore * 0.5);
  const impactScore = Math.round(quantScore * 0.55 + verbScore * 0.45);
  const structureScore = Math.round(sectionScore * 0.6 + lengthScore * 0.4);

  const categoryScores = {
    ats: normalizeScore(atsScore) || 0,
    content: normalizeScore(contentScore) || 0,
    impact: normalizeScore(impactScore) || 0,
    skills: normalizeScore(skillsScore) || 0,
    structure: normalizeScore(structureScore) || 0
  };

  const ruleScore = normalizeScore(
    categoryScores.ats * 0.2 +
      categoryScores.content * 0.25 +
      categoryScores.impact * 0.2 +
      categoryScores.skills * 0.2 +
      categoryScores.structure * 0.15
  ) || 0;

  const improvements = [];
  if (!hasEmail) improvements.push("Add a professional email in the resume header.");
  if (!hasPhone) improvements.push("Add a contact number for recruiter outreach.");
  if (!hasLinkedIn) improvements.push("Add a LinkedIn URL for stronger profile credibility.");
  if (wordCount < 300) improvements.push("Increase resume detail: include more role impact and project specifics.");
  if (quantCount < 2) improvements.push("Add measurable achievements using numbers, percentages, or outcomes.");
  if (verbCount < 4) improvements.push("Use stronger action verbs like built, optimized, implemented, and delivered.");
  if (normalizedSkills.length > 0 && matchedSkills.length < normalizedSkills.length) {
    improvements.push("Align resume keywords with your target internship skills.");
  }

  const strengths = [];
  if (hasEmail && hasPhone) strengths.push("Contact information is present.");
  if (sectionCount >= 4) strengths.push("Resume has good section coverage.");
  if (quantCount >= 2) strengths.push("Resume includes measurable achievements.");
  if (verbCount >= 4) strengths.push("Strong use of action-oriented language.");
  if (matchedSkills.length >= Math.max(2, Math.floor(normalizedSkills.length * 0.6))) strengths.push("Good skill alignment with target roles.");

  const criticalIssues = [];
  if (!hasEmail || !hasPhone) criticalIssues.push("Contact details are incomplete.");
  if (sectionCount < 3) criticalIssues.push("Resume is missing key sections required by ATS.");
  if (wordCount < 180) criticalIssues.push("Resume is too short and may look under-detailed.");
  if (normalizedSkills.length > 0 && matchedSkills.length < Math.ceil(normalizedSkills.length * 0.4)) {
    criticalIssues.push("Skill keyword alignment is weak for target internships.");
  }

  return {
    ruleScore,
    categoryScores,
    checks: {
      hasEmail,
      hasPhone,
      hasLinkedIn,
      wordCount,
      sectionCount,
      quantifiedAchievements: quantCount,
      actionVerbHits: verbCount,
      matchedSkills,
      missingSkills: normalizedSkills.filter((skill) => !matchedSkills.includes(skill))
    },
    strengths,
    improvements: improvements.slice(0, 6),
    criticalIssues: criticalIssues.slice(0, 4),
    sectionBreakdown: [
      { key: "ats", label: "ATS Compatibility", score: normalizeScore(atsScore) || 0 },
      { key: "content", label: "Content Quality", score: normalizeScore(contentScore) || 0 },
      { key: "impact", label: "Impact & Achievements", score: normalizeScore(impactScore) || 0 },
      { key: "skills", label: "Skill Match", score: normalizeScore(skillsScore) || 0 },
      { key: "structure", label: "Structure & Readability", score: normalizeScore(structureScore) || 0 }
    ]
  };
}

async function callScorer(text) {
  let lastError;

  for (let attempt = 1; attempt <= SCORER_MAX_RETRIES; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), SCORER_TIMEOUT_MS);

    try {
      const response = await fetch(`${SCORER_BASE_URL}/score`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ text }),
        signal: controller.signal
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.message || `Scorer returned ${response.status}`);
      }

      const resumeScore = normalizeScore(payload.resumeScore);
      if (resumeScore === null) {
        throw new Error("Scorer payload missing valid resumeScore");
      }

      return {
        resumeScore,
        predictedCategory: payload.predictedCategory || "",
        confidence: typeof payload.confidence === "number" ? payload.confidence : null,
        scoreSource: payload.scoreSource === "fallback" ? "fallback" : "sieve_model"
      };
    } catch (error) {
      lastError = error;
      if (attempt === SCORER_MAX_RETRIES) break;
    } finally {
      clearTimeout(timer);
    }
  }

  throw lastError;
}

function buildAnalysisPayload(overallScore, analysis, scorerWarnings = []) {
  return {
    overallScore,
    categoryScores: analysis.categoryScores,
    sectionBreakdown: analysis.sectionBreakdown || [],
    strengths: analysis.strengths,
    improvements: analysis.improvements,
    criticalIssues: analysis.criticalIssues || [],
    checks: analysis.checks,
    warnings: scorerWarnings
  };
}

async function computeResumeScore({ profile, resumeText }) {
  const text = String(resumeText || profile?.resume?.text || "").trim();

  if (!text) {
    return {
      resumeScore: 0,
      predictedCategory: "",
      confidence: null,
      scoreSource: "none",
      analysis: {
        overallScore: 0,
        categoryScores: { ats: 0, content: 0, impact: 0, skills: 0, structure: 0 },
        sectionBreakdown: [],
        strengths: [],
        improvements: ["Upload a resume to receive detailed analysis."],
        criticalIssues: [],
        warnings: [],
        checks: {}
      }
    };
  }

  const analysis = analyzeResumeText(text, profile?.skills || []);
  const fallbackBaseScore = normalizeScore(calculateResumeScore(profile || { resume: { text } })) || 0;

  if (!SCORER_ENABLED) {
    const resumeScore = normalizeScore(analysis.ruleScore * 0.7 + fallbackBaseScore * 0.3) || 0;
    return {
      resumeScore,
      predictedCategory: "",
      confidence: null,
      scoreSource: "fallback",
      analysis: buildAnalysisPayload(resumeScore, analysis, ["Model scorer disabled. Rule-based analysis is active."])
    };
  }

  try {
    const scorerResult = await callScorer(text);
    const blended =
      scorerResult.scoreSource === "sieve_model"
        ? normalizeScore(scorerResult.resumeScore * 0.45 + analysis.ruleScore * 0.55)
        : normalizeScore(analysis.ruleScore * 0.75 + scorerResult.resumeScore * 0.25);

    const overall = blended || analysis.ruleScore;

    return {
      resumeScore: overall,
      predictedCategory: scorerResult.predictedCategory,
      confidence: scorerResult.confidence,
      scoreSource: scorerResult.scoreSource,
      analysis: buildAnalysisPayload(
        overall,
        analysis,
        scorerResult.scoreSource === "fallback" ? ["Model scorer unavailable. Fallback scoring was used."] : []
      )
    };
  } catch (error) {
    const resumeScore = normalizeScore(analysis.ruleScore * 0.75 + fallbackBaseScore * 0.25) || analysis.ruleScore;
    return {
      resumeScore,
      predictedCategory: "",
      confidence: null,
      scoreSource: "fallback",
      analysis: buildAnalysisPayload(resumeScore, analysis, [
        `Model scorer unavailable: ${(error && error.message) || "unknown error"}. Fallback scoring was used.`
      ])
    };
  }
}

module.exports = { computeResumeScore, SCORER_ENABLED };