/**
 * Structured ROLE → SKILL TAXONOMY
 * core = critical required | secondary = important | optional = nice-to-have
 */
export type SkillTier = "core" | "secondary" | "optional";

export type RoleSkillProfile = {
  label: string;
  coreSkills: string[];
  secondarySkills: string[];
  optionalSkills: string[];
};

export const TARGET_ROLE_PROFILES: Record<string, RoleSkillProfile> = {
  full_stack_developer: {
    label: "Full Stack Developer",
    coreSkills: ["javascript", "react", "node.js", "express.js", "mongodb", "sql", "git"],
    secondarySkills: ["typescript", "html", "css", "docker", "api design"],
    optionalSkills: ["next.js", "kubernetes", "aws", "testing", "github actions"]
  },
  frontend_developer: {
    label: "Frontend Developer",
    coreSkills: ["html", "css", "javascript", "react"],
    secondarySkills: ["typescript", "next.js", "tailwind css", "git", "redux"],
    optionalSkills: ["testing", "accessibility", "figma", "webpack", "state management"]
  },
  backend_developer: {
    label: "Backend Developer",
    coreSkills: ["node.js", "express.js", "sql", "mongodb", "git", "api design"],
    secondarySkills: ["postgresql", "docker", "authentication", "redis"],
    optionalSkills: ["kubernetes", "aws", "microservices", "system design"]
  },
  data_scientist: {
    label: "Data Scientist",
    coreSkills: ["python", "pandas", "statistics", "sql", "data analysis"],
    secondarySkills: ["numpy", "scikit-learn", "machine learning"],
    optionalSkills: ["tensorflow", "pytorch", "tableau", "power bi", "deep learning"]
  },
  ai_ml_engineer: {
    label: "AI / ML Engineer",
    coreSkills: ["python", "machine learning", "numpy", "pandas"],
    secondarySkills: ["deep learning", "tensorflow", "pytorch", "scikit-learn"],
    optionalSkills: ["natural language processing", "computer vision", "docker", "aws"]
  }
};

/** @deprecated alias — maps to optional tier */
export const legacyEmerging = (profile: RoleSkillProfile) => profile.optionalSkills;

export const TARGET_ROLE_OPTIONS = Object.entries(TARGET_ROLE_PROFILES).map(([key, profile]) => ({
  key,
  label: profile.label
}));

export const TIER_WEIGHT: Record<SkillTier, number> = {
  core: 2,
  secondary: 1,
  optional: 0.5
};
