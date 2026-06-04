const { ROLE_SKILL_TEMPLATES } = require("../data/role-skill-templates");
const { normalizeSkillList } = require("../utils/skill-normalizer");

function normalizeRoleKey(role = "") {
  return String(role || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
}

function buildRoadmap({ targetRole, currentSkills = [] }) {
  const roleKey = normalizeRoleKey(targetRole);
  const template = ROLE_SKILL_TEMPLATES[roleKey] || ROLE_SKILL_TEMPLATES.full_stack_developer;
  const normalizedCurrent = normalizeSkillList(currentSkills);
  const normalizedRequired = normalizeSkillList(template.requiredSkills);
  const missingSkills = normalizedRequired.filter((skill) => !normalizedCurrent.includes(skill));

  const roadmap = missingSkills.map((skill, idx) => ({
    skill,
    priority: idx < 3 ? "high" : idx < 6 ? "medium" : "low",
    phase: idx < 3 ? "beginner" : idx < 7 ? "intermediate" : "advanced",
    suggestions: [
      `Build a practical project using ${skill}`,
      `Complete a structured online course on ${skill}`,
      `Add ${skill} usage to your resume and portfolio`
    ]
  }));

  return {
    targetRole: template.role,
    currentSkills: normalizedCurrent,
    requiredSkills: normalizedRequired,
    missingSkills,
    matchPercent: normalizedRequired.length ? Math.round(((normalizedRequired.length - missingSkills.length) / normalizedRequired.length) * 100) : 0,
    roadmap
  };
}

module.exports = { buildRoadmap };
