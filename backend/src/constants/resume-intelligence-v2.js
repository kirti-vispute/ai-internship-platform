/** ATS Resume Intelligence V2 — dimension weights (must sum to 1). */
const DIMENSION_WEIGHTS = Object.freeze({
  structure: 0.15,
  skills: 0.2,
  projects: 0.2,
  education: 0.1,
  certifications: 0.1,
  experience: 0.15,
  achievements: 0.1
});

const SKILL_CATEGORY_TAXONOMY = Object.freeze({
  "Programming Languages": [
    "javascript", "typescript", "python", "java", "c++", "c#", "sql", "html", "css", "go", "rust", "kotlin", "swift"
  ],
  "Web Development": ["react", "next.js", "node.js", "express.js", "angular", "vue", "tailwind css", "bootstrap", "redux"],
  "Mobile Development": ["react native", "flutter", "android", "ios", "kotlin", "swift"],
  Databases: ["mongodb", "mysql", "postgresql", "sql", "firebase", "redis", "dynamodb"],
  Cloud: ["aws", "gcp", "azure", "microsoft azure"],
  DevOps: ["docker", "kubernetes", "ci/cd", "jenkins", "terraform", "github actions"],
  "AI / ML": [
    "machine learning", "artificial intelligence", "deep learning", "natural language processing", "tensorflow", "pytorch",
    "scikit-learn", "keras", "computer vision"
  ],
  "Data Science": ["pandas", "numpy", "data analysis", "data mining", "tableau", "power bi", "matplotlib", "statistics"],
  Tools: ["git", "github", "postman", "figma", "jira", "linux", "vs code"],
  "Soft Skills": [
    "communication", "teamwork", "leadership", "problem solving", "critical thinking", "adaptability", "time management",
    "collaboration", "presentation", "creativity"
  ]
});

const TARGET_ROLE_PROFILES = Object.freeze({
  full_stack_developer: {
    label: "Full Stack Developer",
    coreSkills: ["javascript", "typescript", "react", "node.js", "express.js", "mongodb", "sql", "git", "docker"],
    emergingSkills: ["next.js", "kubernetes", "aws", "testing", "github actions"]
  },
  frontend_developer: {
    label: "Frontend Developer",
    coreSkills: ["javascript", "typescript", "react", "next.js", "html", "css", "tailwind css", "git"],
    emergingSkills: ["redux", "testing", "accessibility", "figma", "webpack"]
  },
  backend_developer: {
    label: "Backend Developer",
    coreSkills: ["node.js", "express.js", "mongodb", "postgresql", "sql", "git", "docker", "api design"],
    emergingSkills: ["kubernetes", "aws", "redis", "microservices", "authentication"]
  },
  data_scientist: {
    label: "Data Scientist",
    coreSkills: ["python", "pandas", "numpy", "scikit-learn", "sql", "data analysis", "statistics"],
    emergingSkills: ["tensorflow", "pytorch", "machine learning", "tableau", "power bi"]
  },
  ai_ml_engineer: {
    label: "AI / ML Engineer",
    coreSkills: ["python", "machine learning", "deep learning", "tensorflow", "pytorch", "numpy", "pandas"],
    emergingSkills: ["natural language processing", "computer vision", "scikit-learn", "docker", "aws"]
  }
});

const REQUIRED_SECTIONS = ["summary", "skills", "projects", "education", "experience", "certifications", "achievements"];

module.exports = {
  DIMENSION_WEIGHTS,
  SKILL_CATEGORY_TAXONOMY,
  TARGET_ROLE_PROFILES,
  REQUIRED_SECTIONS
};
