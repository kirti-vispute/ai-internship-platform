const { computeSkillMatch } = require("../utils/compute-skill-match");
const { normalizeSkillList } = require("../utils/skill-normalizer");
const { canonicalSkill, displaySkill } = require("./resume-structured-parser.service");
const { sanitizeParsed, qualityReport } = require("./resume-quality.service");
const {
  DIMENSION_WEIGHTS,
  SKILL_CATEGORY_TAXONOMY,
  TARGET_ROLE_PROFILES,
  REQUIRED_SECTIONS
} = require("../constants/resume-intelligence-v2");

function clampScore(value) {
  const num = Number(value);
  if (Number.isNaN(num)) return 0;
  return Math.max(0, Math.min(100, Math.round(num)));
}

function hasSection(parsed, text, key) {
  const lower = String(text || "").toLowerCase();
  switch (key) {
    case "summary":
      return Boolean(parsed.summary && parsed.summary.length >= 40);
    case "skills":
      return (parsed.skills || []).length >= 3;
    case "projects":
      return (parsed.projects || []).length > 0;
    case "education":
      return (parsed.education || []).length > 0;
    case "experience":
      return (parsed.experience || []).length > 0 || /internship|experience|worked at/i.test(lower);
    case "certifications":
      return (parsed.certifications || []).length > 0;
    case "achievements":
      return (parsed.achievements || []).length > 0;
    default:
      return false;
  }
}

function categorizeSkillsV2(skillList = []) {
  const normalized = normalizeSkillList(skillList).map((s) => canonicalSkill(s)).filter(Boolean);
  const groups = {};

  for (const [category, tokens] of Object.entries(SKILL_CATEGORY_TAXONOMY)) {
    const matched = normalized.filter((skill) => tokens.some((token) => skill === token || skill.includes(token))).map(displaySkill);
    if (matched.length > 0) {
      groups[category] = [...new Set(matched)];
    }
  }

  const assigned = new Set(Object.values(groups).flat().map((s) => s.toLowerCase()));
  const uncategorized = skillList
    .map((s) => displaySkill(canonicalSkill(s) || s))
    .filter((s) => s && !assigned.has(s.toLowerCase()));

  if (uncategorized.length > 0) {
    groups.Other = uncategorized.slice(0, 12);
  }

  return groups;
}

function scoreStructure(parsed, text, textAnalysis) {
  const present = REQUIRED_SECTIONS.filter((key) => hasSection(parsed, text, key));
  const sectionCoverage = (present.length / REQUIRED_SECTIONS.length) * 100;
  const formatting = textAnalysis?.categoryScores?.formattingQuality ?? textAnalysis?.checks?.formattingQualityScore ?? 60;
  const readability = textAnalysis?.categoryScores?.structure ?? 65;
  const wordCount = textAnalysis?.checks?.wordCount ?? String(text || "").split(/\s+/).length;
  const lengthFit = wordCount >= 280 && wordCount <= 950 ? 100 : wordCount >= 200 ? 75 : 45;

  const score = clampScore(sectionCoverage * 0.45 + formatting * 0.3 + readability * 0.15 + lengthFit * 0.1);
  const suggestions = [];
  if (present.length < 5) suggestions.push("Add missing sections: summary, skills, projects, education, and experience.");
  if (wordCount < 250) suggestions.push("Expand resume content with measurable outcomes and project details.");
  if (formatting < 70) suggestions.push("Improve formatting consistency and section headings for ATS parsing.");

  return {
    key: "structure",
    label: "Resume Structure",
    weight: DIMENSION_WEIGHTS.structure,
    score,
    explanation: `${present.length}/${REQUIRED_SECTIONS.length} core sections detected with readable formatting.`,
    suggestions: suggestions.slice(0, 3)
  };
}

function scoreSkillsDimension(parsed, profile) {
  const skills = normalizeSkillList([...(parsed.skills || []), ...(profile?.skills || [])]);
  const categories = Object.keys(categorizeSkillsV2(skills)).length;
  const diversity = Math.min(100, categories * 18);
  const depth = Math.min(100, skills.length * 7);
  const hasModern = skills.some((s) => /react|python|typescript|docker|aws|machine learning/i.test(s));

  const score = clampScore(depth * 0.45 + diversity * 0.35 + (hasModern ? 20 : 8));
  const suggestions = [];
  if (skills.length < 6) suggestions.push("Add more role-relevant technical skills aligned with your target internships.");
  if (categories < 3) suggestions.push("Broaden skill coverage across frameworks, databases, and tools.");
  if (!(parsed.softSkills || []).length) suggestions.push("Include soft skills such as communication and teamwork.");

  return {
    key: "skills",
    label: "Skills",
    weight: DIMENSION_WEIGHTS.skills,
    score,
    explanation: `${skills.length} skills across ${categories} categories.`,
    suggestions: suggestions.slice(0, 3),
    skillCount: skills.length
  };
}

function scoreProjects(parsed) {
  const projects = parsed.projects || [];
  if (projects.length === 0) {
    return {
      key: "projects",
      label: "Projects",
      weight: DIMENSION_WEIGHTS.projects,
      score: 15,
      explanation: "No structured projects detected.",
      suggestions: ["Add 2–3 projects with tech stack, outcomes, and deployment/GitHub links."]
    };
  }

  let quality = 0;
  for (const project of projects) {
    let pts = 35;
    if ((project.techStack || []).length >= 2) pts += 20;
    if (project.description && project.description.length > 80) pts += 15;
    if (project.githubLink) pts += 15;
    if (project.demoLink) pts += 15;
    quality += Math.min(100, pts);
  }

  const avg = quality / projects.length;
  const githubBonus = projects.some((p) => p.githubLink) ? 8 : 0;
  const score = clampScore(avg + githubBonus);

  return {
    key: "projects",
    label: "Projects",
    weight: DIMENSION_WEIGHTS.projects,
    score,
    explanation: `${projects.length} project(s) evaluated for depth, stack, and links.`,
    suggestions: score < 70 ? ["Add deployment links and quantify project impact.", "List technologies used per project."] : ["Highlight scalability or user metrics in top projects."]
  };
}

function scoreEducation(parsed) {
  const entries = parsed.education || [];
  if (entries.length === 0) {
    return {
      key: "education",
      label: "Education",
      weight: DIMENSION_WEIGHTS.education,
      score: 20,
      explanation: "Education section not detected.",
      suggestions: ["Add degree, institution, branch, CGPA/percentage, and graduation year."]
    };
  }

  let pts = 50;
  const first = entries[0] || {};
  if (first.degree) pts += 15;
  if (first.institution) pts += 15;
  if (first.grade || first.branch) pts += 10;
  if (first.graduationYear) pts += 10;

  return {
    key: "education",
    label: "Education",
    weight: DIMENSION_WEIGHTS.education,
    score: clampScore(pts),
    explanation: `${entries.length} education record(s) parsed.`,
    suggestions: pts < 80 ? ["Ensure CGPA/percentage and graduation year are visible."] : []
  };
}

function scoreCertifications(parsed) {
  const certs = parsed.certifications || [];
  const score = certs.length === 0 ? 25 : clampScore(40 + Math.min(60, certs.length * 18));
  return {
    key: "certifications",
    label: "Certifications",
    weight: DIMENSION_WEIGHTS.certifications,
    score,
    explanation: certs.length ? `${certs.length} certification(s) found.` : "No certifications listed.",
    suggestions: certs.length < 2 ? ["Add industry-relevant certifications (AWS, Google, NPTEL, Coursera)."] : []
  };
}

function scoreExperience(parsed, textAnalysis) {
  const exp = parsed.experience || [];
  const impact = textAnalysis?.categoryScores?.experienceWeighted ?? 55;
  const score =
    exp.length === 0
      ? clampScore(impact * 0.5)
      : clampScore(50 + Math.min(40, exp.length * 12) + impact * 0.1);

  return {
    key: "experience",
    label: "Experience / Internships",
    weight: DIMENSION_WEIGHTS.experience,
    score,
    explanation: exp.length ? `${exp.length} experience/internship entries.` : "Limited experience section detected.",
    suggestions: exp.length === 0 ? ["Add internships, freelance work, or leadership roles with outcomes."] : ["Use action verbs and measurable results per role."]
  };
}

function scoreAchievements(parsed) {
  const items = parsed.achievements || [];
  const score = items.length === 0 ? 20 : clampScore(45 + Math.min(55, items.length * 14));
  return {
    key: "achievements",
    label: "Achievements",
    weight: DIMENSION_WEIGHTS.achievements,
    score,
    explanation: items.length ? `${items.length} achievement(s) detected.` : "No awards or recognition listed.",
    suggestions: items.length < 2 ? ["Add hackathons, competitions, scholarships, or academic awards."] : []
  };
}

function buildSkillIntelligence(parsed, profile, targetRoleKey = "full_stack_developer") {
  const allSkills = normalizeSkillList([
    ...(parsed.skills || []),
    ...(parsed.technicalSkills || []),
    ...(profile?.skills || [])
  ]);

  const categorized = categorizeSkillsV2(allSkills);
  const roleProfile = TARGET_ROLE_PROFILES[targetRoleKey] || TARGET_ROLE_PROFILES.full_stack_developer;
  const required = [...roleProfile.coreSkills, ...roleProfile.emergingSkills];
  const match = computeSkillMatch(allSkills, required, []);

  const strengths = [];
  if ((categorized["Programming Languages"] || []).length >= 2) strengths.push("Strong programming language foundation.");
  if ((categorized["Web Development"] || []).length >= 2) strengths.push("Solid web development stack.");
  if ((categorized["AI / ML"] || []).length >= 2) strengths.push("AI/ML skills present on profile.");
  if ((parsed.projects || []).length >= 2) strengths.push("Good project diversity for internship screening.");

  const gaps = match.missingRequiredSkills
    .map(displaySkill)
    .filter((skill) => skill && skill.length > 2 && !/^(ci|cd)$/i.test(skill));
  const recommendations = gaps.slice(0, 6).map((skill) => `Build proficiency in ${skill} through a focused project or certification.`);

  if (gaps.some((g) => /docker|kubernetes|aws|deployment/i.test(g))) {
    recommendations.push("Add a cloud deployment project to demonstrate production readiness.");
  }
  if (gaps.some((g) => /test|jest|cypress/i.test(g))) {
    recommendations.push("Include automated testing in your next project README.");
  }

  return {
    overview: {
      totalSkills: allSkills.length,
      categoryCount: Object.keys(categorized).length,
      matchPercent: match.requiredMatchPercent
    },
    categorized,
    strengths: strengths.slice(0, 5),
    skillGaps: gaps,
    emergingGaps: roleProfile.emergingSkills
      .filter((s) => !allSkills.map(canonicalSkill).includes(canonicalSkill(s)))
      .map(displaySkill)
      .slice(0, 8),
    targetRole: roleProfile.label,
    targetRoleKey,
    careerMatch: {
      matchPercent: match.requiredMatchPercent,
      matchedSkills: match.matchedRequiredSkills.map(displaySkill),
      missingSkills: gaps
    },
    learningRecommendations: [...new Set(recommendations)].slice(0, 6)
  };
}

function buildCompositeScores(dimensions, textAnalysis, quality) {
  const weighted = dimensions.reduce((sum, dim) => sum + dim.score * dim.weight, 0);
  const overall = clampScore(weighted);

  const structure = dimensions.find((d) => d.key === "structure")?.score ?? 0;
  const skills = dimensions.find((d) => d.key === "skills")?.score ?? 0;
  const projects = dimensions.find((d) => d.key === "projects")?.score ?? 0;
  const ats = clampScore(
    (textAnalysis?.categoryScores?.ats ?? 0) * 0.4 +
      structure * 0.35 +
      (textAnalysis?.checks?.completenessPercent ?? 0) * 0.25
  );

  const technicalStrength = clampScore(skills * 0.6 + (textAnalysis?.categoryScores?.roleSpecific ?? 0) * 0.4);
  const projectStrength = projects;
  const skillStrength = skills;
  const profileCompleteness = clampScore(textAnalysis?.checks?.completenessPercent ?? quality.confidence * 100);
  const recruiterReadiness = clampScore(
    overall * 0.35 + projectStrength * 0.25 + technicalStrength * 0.2 + ats * 0.2
  );

  return {
    overall,
    ats,
    technicalStrength,
    projectStrength,
    skillStrength,
    profileCompleteness,
    recruiterReadiness
  };
}

function buildStrengthsWeaknesses(dimensions, skillIntelligence, textAnalysis) {
  const strengths = [...(textAnalysis?.strengths || []), ...skillIntelligence.strengths].slice(0, 8);
  const weaknesses = [];

  for (const dim of dimensions) {
    if (dim.score < 55 && dim.suggestions?.[0]) {
      weaknesses.push(`${dim.label}: ${dim.suggestions[0]}`);
    }
  }

  if (skillIntelligence.skillGaps.length > 0) {
    weaknesses.push(`Missing role skills: ${skillIntelligence.skillGaps.slice(0, 4).join(", ")}.`);
  }

  const improvements = [];
  for (const dim of dimensions) {
    improvements.push(...(dim.suggestions || []));
  }
  improvements.push(...skillIntelligence.learningRecommendations);

  return {
    strengths: [...new Set(strengths)].slice(0, 8),
    weaknesses: [...new Set(weaknesses)].slice(0, 6),
    improvements: [...new Set(improvements)].slice(0, 8)
  };
}

/**
 * Resume Intelligence V2 — structured ATS scoring from parsed resume + text signals.
 */
function computeResumeIntelligenceV2({ profile = {}, resumeText = "", textAnalysis = null, targetRoleKey = "full_stack_developer" }) {
  const text = String(resumeText || profile?.resume?.text || "").trim();
  const parsed = sanitizeParsed(profile?.resume?.parsed || {});
  const quality = qualityReport(parsed);

  if (!text) {
    return {
      intelligenceVersion: "v2",
      overallScore: 0,
      compositeScores: {
        overall: 0,
        ats: 0,
        technicalStrength: 0,
        projectStrength: 0,
        skillStrength: 0,
        profileCompleteness: 0,
        recruiterReadiness: 0
      },
      dimensionBreakdown: [],
      skillIntelligence: null,
      strengths: [],
      weaknesses: ["Upload a resume to begin analysis."],
      improvements: ["Upload a PDF, DOCX, or TXT resume."],
      criticalIssues: [],
      quality,
      confidence: 0
    };
  }

  const dimensions = [
    scoreStructure(parsed, text, textAnalysis),
    scoreSkillsDimension(parsed, profile),
    scoreProjects(parsed),
    scoreEducation(parsed),
    scoreCertifications(parsed),
    scoreExperience(parsed, textAnalysis),
    scoreAchievements(parsed)
  ];

  const skillIntelligence = buildSkillIntelligence(parsed, profile, targetRoleKey);
  const compositeScores = buildCompositeScores(dimensions, textAnalysis, quality);
  const narrative = buildStrengthsWeaknesses(dimensions, skillIntelligence, textAnalysis);

  let overallScore = compositeScores.overall;
  if (!quality.isReliable) {
    overallScore = clampScore(overallScore * quality.confidence);
  }

  const criticalIssues = [...(textAnalysis?.criticalIssues || [])];
  if (quality.issues.length > 0) {
    criticalIssues.push(...quality.issues.slice(0, 3));
  }

  return {
    intelligenceVersion: "v2",
    overallScore,
    compositeScores: { ...compositeScores, overall: overallScore },
    dimensionBreakdown: dimensions,
    skillIntelligence,
    strengths: narrative.strengths,
    weaknesses: narrative.weaknesses,
    improvements: narrative.improvements,
    criticalIssues: criticalIssues.slice(0, 5),
    quality,
    confidence: quality.confidence,
    sectionBreakdown: dimensions.map((d) => ({ key: d.key, label: d.label, score: d.score, weight: d.weight }))
  };
}

module.exports = {
  computeResumeIntelligenceV2,
  categorizeSkillsV2,
  buildSkillIntelligence,
  TARGET_ROLE_PROFILES
};
