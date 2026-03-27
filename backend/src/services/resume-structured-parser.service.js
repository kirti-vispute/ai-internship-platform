const DEGREE_PATTERN = /(b\.?\s?tech|m\.?\s?tech|b\.?\s?e|m\.?\s?e|bca|mca|bsc|msc|b\.?\s?com|m\.?\s?com|mba|phd|diploma)/i;
const YEAR_PATTERN = /(19|20)\d{2}/g;

const SECTION_ALIASES = {
  summary: ["summary", "profile", "objective", "about me"],
  skills: ["skills", "technical skills", "core skills", "technologies", "tech stack"],
  projects: ["projects", "project experience", "academic projects"],
  education: ["education", "academic", "qualifications"],
  certifications: ["certifications", "certificates", "licenses", "achievements"],
  experience: ["experience", "work experience", "professional experience", "internship", "employment"]
};

const SKILL_ALIASES = {
  js: "javascript",
  javascript: "javascript",
  ts: "typescript",
  typescript: "typescript",
  nodejs: "node.js",
  node: "node.js",
  expressjs: "express.js",
  express: "express.js",
  reactjs: "react",
  react: "react",
  nextjs: "next.js",
  next: "next.js",
  ml: "machine learning",
  ai: "artificial intelligence",
  dl: "deep learning",
  nlp: "natural language processing",
  mongodb: "mongodb",
  mongo: "mongodb",
  sql: "sql",
  mysql: "mysql",
  postgresql: "postgresql",
  python: "python",
  java: "java",
  cpp: "c++",
  csharp: "c#",
  html: "html",
  css: "css",
  tailwind: "tailwind css",
  git: "git",
  github: "github",
  docker: "docker",
  aws: "aws",
  gcp: "gcp",
  firebase: "firebase",
  figma: "figma",
  powerbi: "power bi",
  powerbii: "power bi",
  tableau: "tableau",
  excel: "excel",
  pandas: "pandas",
  numpy: "numpy",
  sklearn: "scikit-learn",
  pytorch: "pytorch",
  tensorflow: "tensorflow"
};

const SKILL_KEYWORDS = new Set([
  "javascript", "typescript", "node.js", "express.js", "react", "next.js", "html", "css", "tailwind css",
  "python", "java", "c++", "c#", "sql", "mysql", "postgresql", "mongodb", "firebase", "aws", "gcp", "docker",
  "git", "github", "machine learning", "deep learning", "artificial intelligence", "natural language processing",
  "data analysis", "pandas", "numpy", "scikit-learn", "tensorflow", "pytorch", "power bi", "tableau", "excel", "figma"
]);

function cleanLine(line = "") {
  return String(line || "").replace(/\u2022/g, "-").replace(/\s+/g, " ").trim();
}

function normalizeLines(text = "") {
  return String(text || "")
    .split(/\r?\n/)
    .map(cleanLine)
    .filter(Boolean);
}

function isHeading(line) {
  const normalized = line.toLowerCase().replace(/[^a-z\s]/g, "").trim();
  if (!normalized || normalized.split(" ").length > 5) return false;
  return Object.values(SECTION_ALIASES).some((aliases) => aliases.includes(normalized));
}

function headingToKey(line) {
  const normalized = line.toLowerCase().replace(/[^a-z\s]/g, "").trim();
  return Object.keys(SECTION_ALIASES).find((key) => SECTION_ALIASES[key].includes(normalized)) || null;
}

function splitSections(lines = []) {
  const sections = {};
  let currentKey = "header";
  sections[currentKey] = [];

  for (const line of lines) {
    if (isHeading(line)) {
      currentKey = headingToKey(line) || "other";
      if (!sections[currentKey]) sections[currentKey] = [];
      continue;
    }
    if (!sections[currentKey]) sections[currentKey] = [];
    sections[currentKey].push(line);
  }

  return sections;
}

function extractEmail(text = "") {
  const match = String(text).match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-z]{2,}/);
  return match ? match[0].toLowerCase() : "";
}

function extractMobile(text = "") {
  const match = String(text).match(/(?:\+?\d{1,3}[-\s]?)?(?:\d[-\s]?){10,12}/);
  if (!match) return "";
  return match[0].replace(/[^\d+]/g, "");
}

function extractLinks(text = "") {
  const matches = String(text).match(/https?:\/\/[^\s)]+|(?:www\.)[^\s)]+|(?:linkedin\.com|github\.com)\/[^\s)]+/gi) || [];
  return [...new Set(matches.map((link) => (link.startsWith("http") ? link : `https://${link}`)))];
}

function extractFullName(lines = []) {
  const candidate = lines.find((line) => {
    if (/@/.test(line)) return false;
    if (/\d{6,}/.test(line)) return false;
    if (isHeading(line)) return false;
    const words = line.split(" ").filter(Boolean);
    return words.length >= 2 && words.length <= 5;
  });
  return candidate || "";
}

function toTitleCase(value = "") {
  return value
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function normalizeSkill(raw = "") {
  const normalized = String(raw || "").trim().toLowerCase().replace(/[^\w+.#\s-]/g, "");
  if (!normalized) return "";
  if (SKILL_ALIASES[normalized]) return SKILL_ALIASES[normalized];
  return normalized;
}

function displaySkill(skill = "") {
  if (!skill) return "";
  const special = {
    "node.js": "Node.js",
    "express.js": "Express.js",
    "next.js": "Next.js",
    "c++": "C++",
    "c#": "C#",
    aws: "AWS",
    gcp: "GCP",
    sql: "SQL",
    mongodb: "MongoDB",
    "scikit-learn": "Scikit-learn",
    "power bi": "Power BI"
  };
  if (special[skill]) return special[skill];
  return toTitleCase(skill);
}

function extractSkills(text = "", sections = {}) {
  const source = [text, ...(sections.skills || [])].join(" ").toLowerCase();
  const tokens = source.split(/[,/|•\-\n]/).map((item) => item.trim()).filter(Boolean);

  const found = new Set();
  for (const token of tokens) {
    const normalized = normalizeSkill(token);
    if (normalized && SKILL_KEYWORDS.has(normalized)) found.add(normalized);
  }

  for (const keyword of SKILL_KEYWORDS) {
    if (source.includes(keyword)) found.add(keyword);
  }

  return [...found].map(displaySkill).sort((a, b) => a.localeCompare(b));
}

function extractSummary(sections = {}, lines = []) {
  const summaryLines = sections.summary || [];
  if (summaryLines.length > 0) return summaryLines.slice(0, 3).join(" ");
  return lines.slice(0, 2).join(" ");
}

function extractEducation(sections = {}) {
  const source = sections.education || [];
  return source
    .filter((line) => DEGREE_PATTERN.test(line) || /university|college|institute|school/i.test(line))
    .slice(0, 6)
    .map((line) => {
      const degreeMatch = line.match(DEGREE_PATTERN);
      const years = line.match(YEAR_PATTERN) || [];
      const year = years.length > 0 ? years[years.length - 1] : "";
      return {
        degree: degreeMatch ? degreeMatch[0] : "",
        college: line.replace(DEGREE_PATTERN, "").replace(YEAR_PATTERN, "").replace(/[-|]/g, " ").trim(),
        year,
        raw: line
      };
    });
}

function extractProjects(sections = {}) {
  const lines = sections.projects || [];
  const items = [];

  for (const line of lines.slice(0, 10)) {
    const parts = line.split(/[:|-]/).map((part) => part.trim()).filter(Boolean);
    const title = parts[0] || line;
    const description = parts.slice(1).join(" - ") || line;
    const techStackMatch = description.match(/(using|tech stack|technologies)\s*[:\-]?\s*(.*)$/i);
    const techStack = techStackMatch ? techStackMatch[2].split(/[,/|]/).map((t) => displaySkill(normalizeSkill(t))).filter(Boolean) : [];

    items.push({
      title,
      techStack,
      description
    });
  }

  return items;
}

function extractCertifications(sections = {}) {
  const lines = sections.certifications || [];
  return lines.slice(0, 8).map((line) => {
    const years = line.match(YEAR_PATTERN) || [];
    return {
      name: line.replace(YEAR_PATTERN, "").trim(),
      issuer: /coursera|udemy|nptel|edx|google|microsoft|aws/i.test(line) ? line.match(/coursera|udemy|nptel|edx|google|microsoft|aws/i)?.[0] || "" : "",
      year: years.length > 0 ? years[years.length - 1] : "",
      raw: line
    };
  });
}

function extractExperience(sections = {}) {
  const lines = sections.experience || [];
  return lines.slice(0, 10).map((line) => {
    const parts = line.split(/[:|-]/).map((part) => part.trim()).filter(Boolean);
    const role = parts[0] || line;
    const years = line.match(YEAR_PATTERN) || [];
    return {
      role,
      company: parts[1] || "",
      duration: years.join(" - "),
      description: line
    };
  });
}

function structuredResumeParse(text = "") {
  const lines = normalizeLines(text);
  const sections = splitSections(lines);
  const email = extractEmail(text);
  const mobile = extractMobile(text);
  const links = extractLinks(text);
  const fullName = extractFullName(lines);

  const parsed = {
    fullName,
    email,
    mobile,
    links,
    summary: extractSummary(sections, lines),
    skills: extractSkills(text, sections),
    projects: extractProjects(sections),
    education: extractEducation(sections),
    certifications: extractCertifications(sections),
    experience: extractExperience(sections)
  };

  // Future plug-in point: replace/augment regex parser with Gemini/OpenAI structured extraction.
  return parsed;
}

module.exports = {
  structuredResumeParse,
  normalizeSkill,
  displaySkill
};
