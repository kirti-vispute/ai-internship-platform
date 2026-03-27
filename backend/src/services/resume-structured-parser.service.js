const YEAR_REGEX = /\b(?:19|20)\d{2}\b/g;
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-z]{2,}/i;
const PHONE_REGEX = /(?:\+?\d{1,3}[\s-]?)?(?:\(?\d{3,5}\)?[\s-]?)?\d[\d\s-]{7,13}\d/;
const URL_REGEX = /https?:\/\/[^\s)]+|www\.[^\s)]+|(?:linkedin\.com|github\.com)\/[^\s)]+/gi;

const SECTION_RULES = [
  { key: "summary", labels: ["summary", "profile summary", "professional summary", "objective", "about", "about me", "career objective"] },
  { key: "skills", labels: ["technical skills", "skills", "core skills", "key skills", "technologies", "tools", "tech stack", "programming languages"] },
  { key: "projects", labels: ["projects", "project", "project experience", "major projects", "academic projects"] },
  { key: "education", labels: ["education", "academic", "academics", "qualifications", "educational qualification"] },
  { key: "experience", labels: ["experience", "work experience", "professional experience", "internship", "internships", "employment"] },
  { key: "certifications", labels: ["certifications", "certificates", "courses", "licenses", "trainings"] },
  { key: "achievements", labels: ["achievements", "awards", "accomplishments", "honors"] },
  { key: "additional", labels: ["additional information", "additional details", "extra curricular", "extracurricular", "profiles", "contact links"] }
];

const SKILL_ALIASES = {
  js: "javascript",
  javascript: "javascript",
  ts: "typescript",
  typescript: "typescript",
  sql: "sql",
  mysql: "mysql",
  postgresql: "postgresql",
  postgres: "postgresql",
  nodejs: "node.js",
  node: "node.js",
  "node js": "node.js",
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
  mongo: "mongodb",
  mongodb: "mongodb",
  cpp: "c++",
  csharp: "c#",
  tailwind: "tailwind css",
  "tailwindcss": "tailwind css",
  powerbi: "power bi",
  sklearn: "scikit-learn"
};

const DISPLAY_OVERRIDES = {
  "node.js": "Node.js",
  "express.js": "Express.js",
  "next.js": "Next.js",
  sql: "SQL",
  aws: "AWS",
  gcp: "GCP",
  mongodb: "MongoDB",
  "c++": "C++",
  "c#": "C#",
  "power bi": "Power BI",
  "scikit-learn": "Scikit-learn"
};

const KNOWN_SKILLS = new Set([
  "javascript", "typescript", "react", "next.js", "node.js", "express.js", "html", "css", "tailwind css", "bootstrap",
  "python", "java", "c++", "c#", "sql", "mysql", "postgresql", "mongodb", "firebase", "docker", "kubernetes",
  "git", "github", "aws", "gcp", "machine learning", "artificial intelligence", "deep learning", "natural language processing",
  "data analysis", "excel", "power bi", "tableau", "tensorflow", "pytorch", "scikit-learn", "pandas", "numpy", "figma", "postman"
]);

function cleanLine(input = "") {
  return String(input || "")
    .replace(/\u2022|\u25CF|\u25AA/g, "-")
    .replace(/[\t\r]+/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function toLines(rawText = "") {
  return String(rawText || "")
    .split(/\n/)
    .map(cleanLine)
    .filter(Boolean);
}

function normalizeHeaderText(line = "") {
  return String(line || "")
    .toLowerCase()
    .replace(/[:|\-]/g, " ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isLikelyHeading(line = "") {
  const trimmed = String(line || "").trim();
  if (!trimmed) return false;
  if (trimmed.length > 55) return false;

  const normalized = normalizeHeaderText(trimmed);
  const words = normalized.split(" ").filter(Boolean);
  if (words.length === 0 || words.length > 6) return false;

  const upperRatio = (trimmed.match(/[A-Z]/g) || []).length / Math.max(trimmed.replace(/[^a-zA-Z]/g, "").length, 1);
  return upperRatio > 0.65 || /:$/.test(trimmed);
}

function detectSection(line = "") {
  const normalized = normalizeHeaderText(line);
  if (!normalized) return null;

  for (const rule of SECTION_RULES) {
    if (rule.labels.some((label) => normalized === label || normalized.includes(label))) {
      return rule.key;
    }
  }
  return null;
}

function splitSections(lines = []) {
  const sections = {
    header: [],
    summary: [],
    skills: [],
    projects: [],
    education: [],
    experience: [],
    certifications: [],
    achievements: [],
    additional: []
  };

  let current = "header";

  for (const line of lines) {
    const section = detectSection(line);
    if (section && isLikelyHeading(line)) {
      current = section;
      continue;
    }

    if (current === "header" && isLikelyHeading(line)) {
      const maybeSection = detectSection(line);
      if (maybeSection) {
        current = maybeSection;
        continue;
      }
    }

    sections[current].push(line);
  }

  return sections;
}

function extractEmail(text = "") {
  const match = String(text).match(EMAIL_REGEX);
  return match ? match[0].toLowerCase() : "";
}

function extractMobile(text = "") {
  const match = String(text).match(PHONE_REGEX);
  if (!match) return "";
  const compact = match[0].replace(/[^\d+]/g, "");
  return compact.length >= 10 ? compact : "";
}

function extractLinks(text = "") {
  const links = String(text).match(URL_REGEX) || [];
  return [...new Set(links.map((link) => (link.startsWith("http") ? link : `https://${link}`)))];
}

function extractFullName(lines = []) {
  const candidates = lines.slice(0, 10);
  for (const line of candidates) {
    if (EMAIL_REGEX.test(line) || PHONE_REGEX.test(line) || URL_REGEX.test(line)) continue;
    const words = line.split(/\s+/).filter(Boolean);
    if (words.length < 2 || words.length > 5) continue;
    if (!/^[a-zA-Z.\s]+$/.test(line)) continue;
    return line.trim();
  }
  return "";
}

function canonicalSkill(raw = "") {
  const cleaned = String(raw || "")
    .toLowerCase()
    .replace(/[^a-z0-9+.#\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!cleaned) return "";
  return SKILL_ALIASES[cleaned] || cleaned;
}

function displaySkill(skill = "") {
  if (!skill) return "";
  if (DISPLAY_OVERRIDES[skill]) return DISPLAY_OVERRIDES[skill];
  return skill
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function extractSkills(rawText = "", sections = {}) {
  const skillSource = [...(sections.skills || []), ...(sections.additional || [])].join(" | ");
  const parts = skillSource
    .split(/[|,;/]/)
    .map((part) => part.replace(/^[-*]\s*/, "").trim())
    .filter(Boolean);

  const normalized = new Set();

  for (const token of parts) {
    const normalizedToken = canonicalSkill(token);
    if (KNOWN_SKILLS.has(normalizedToken)) {
      normalized.add(normalizedToken);
      continue;
    }

    token
      .split(/\s+/)
      .map(canonicalSkill)
      .filter(Boolean)
      .forEach((piece) => {
        if (KNOWN_SKILLS.has(piece)) normalized.add(piece);
      });
  }

  const fullText = `${rawText}\n${skillSource}`.toLowerCase();
  for (const skill of KNOWN_SKILLS) {
    const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (new RegExp(`\\b${escaped}\\b`, "i").test(fullText)) {
      normalized.add(skill);
    }
  }

  return [...normalized].map(displaySkill).sort((a, b) => a.localeCompare(b));
}

function extractSummary(sections = {}, lines = []) {
  const summaryLines = sections.summary || [];
  if (summaryLines.length > 0) return summaryLines.slice(0, 4).join(" ");

  const headerLong = (sections.header || []).find((line) => line.length > 70);
  if (headerLong) return headerLong;

  const longLine = lines.find((line) => line.length > 80 && !isLikelyHeading(line));
  return longLine || "";
}

function splitBlocks(lines = []) {
  const blocks = [];
  let current = [];

  const flush = () => {
    if (current.length > 0) {
      blocks.push(current);
      current = [];
    }
  };

  for (const line of lines) {
    const bullet = /^[-*]\s+/.test(line) || /^\d+[.)]\s+/.test(line);
    const titleLike = /^[A-Za-z][A-Za-z0-9 '&()+.#/-]{2,70}(?:\s*[:|-].*)?$/.test(line) && !line.endsWith(".") && line.split(" ").length <= 12;

    if ((bullet || titleLike) && current.length > 0) {
      flush();
    }
    current.push(line.replace(/^[-*]\s+|^\d+[.)]\s+/, "").trim());
  }
  flush();

  return blocks;
}

function extractTechStack(text = "") {
  const found = new Set();
  const lower = String(text || "").toLowerCase();

  for (const skill of KNOWN_SKILLS) {
    const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (new RegExp(`\\b${escaped}\\b`, "i").test(lower)) {
      found.add(displaySkill(skill));
    }
  }

  return [...found].sort((a, b) => a.localeCompare(b));
}

function pickProjectTitle(firstLine = "", fallbackIndex = 1) {
  const stripped = firstLine.replace(/^project\s*[:\-]?/i, "").trim();
  if (!stripped) return `Project ${fallbackIndex}`;

  const bySeparator = stripped.split(/[:|-]/)[0].trim();
  if (bySeparator.split(" ").length <= 10 && bySeparator.length <= 80) {
    return bySeparator;
  }
  return stripped.slice(0, 70);
}

function extractProjects(sections = {}) {
  const sourceLines = sections.projects || [];
  if (sourceLines.length === 0) return [];

  return splitBlocks(sourceLines)
    .slice(0, 10)
    .map((block, index) => {
      const combined = block.join(" ");
      const first = block[0] || "";
      const urls = combined.match(URL_REGEX) || [];
      const demoLink = urls[0] ? (urls[0].startsWith("http") ? urls[0] : `https://${urls[0]}`) : "";

      const techMatch = combined.match(/(?:tech(?:nologies|\s*stack)?|stack|built with|using)\s*[:\-]\s*([^.;]+)/i);
      const techStack = techMatch ? extractTechStack(techMatch[1]) : extractTechStack(combined);

      return {
        title: pickProjectTitle(first, index + 1),
        description: combined,
        techStack,
        demoLink
      };
    })
    .filter((project) => project.title || project.description);
}

function extractEducation(sections = {}) {
  const sourceLines = sections.education || [];
  if (sourceLines.length === 0) return [];

  return splitBlocks(sourceLines)
    .slice(0, 10)
    .map((block) => {
      const raw = block.join(" | ");
      const line = block.join(" ");
      const years = line.match(YEAR_REGEX) || [];
      const degreeMatch = line.match(/(b\.?\s?tech|m\.?\s?tech|b\.?\s?e|m\.?\s?e|bca|mca|bsc|msc|mba|ph\.?d|diploma|bachelor[^,|;]*|master[^,|;]*)/i);
      const gradeMatch = line.match(/(?:cgpa|gpa|grade|percentage|percent|marks?)\s*[:\-]?\s*([0-9]+(?:\.[0-9]+)?\s*%?)/i);

      const institutionPart = block.find((item) => /(university|college|institute|school|academy|polytechnic)/i.test(item)) || "";
      const degree = degreeMatch ? degreeMatch[0].trim() : "";
      const institution = institutionPart || line.replace(degree, "").replace(/(?:19|20)\d{2}/g, "").trim();

      return {
        degree,
        institution: institution.replace(/^[|,:\-\s]+|[|,:\-\s]+$/g, ""),
        startYear: years[0] || "",
        endYear: years[1] || years[0] || "",
        grade: gradeMatch ? gradeMatch[1].trim() : "",
        raw
      };
    })
    .filter((item) => item.degree || item.institution || item.raw);
}

function extractCertifications(sections = {}) {
  const sourceLines = [...(sections.certifications || []), ...(sections.additional || []).filter((line) => /cert|course|credential|license/i.test(line))];
  if (sourceLines.length === 0) return [];

  return splitBlocks(sourceLines)
    .slice(0, 12)
    .map((block) => {
      const text = block.join(" ");
      const years = text.match(YEAR_REGEX) || [];
      const issuer = (text.match(/coursera|udemy|nptel|edx|google|microsoft|aws|meta|ibm|oracle|linkedin/i) || [""])[0];
      return {
        name: text.replace(/(?:19|20)\d{2}/g, "").trim(),
        issuer,
        year: years[years.length - 1] || "",
        raw: text
      };
    })
    .filter((item) => item.name || item.raw);
}

function extractExperience(sections = {}) {
  const sourceLines = sections.experience || [];
  if (sourceLines.length === 0) return [];

  return splitBlocks(sourceLines)
    .slice(0, 12)
    .map((block) => {
      const text = block.join(" ");
      const years = text.match(YEAR_REGEX) || [];
      const first = block[0] || "";
      const pieces = first.split(/[:|-]/).map((part) => part.trim()).filter(Boolean);

      return {
        role: pieces[0] || "",
        company: pieces[1] || "",
        duration: years.length > 1 ? `${years[0]} - ${years[1]}` : years[0] || "",
        description: text
      };
    })
    .filter((item) => item.role || item.company || item.description);
}

function extractAchievements(sections = {}) {
  const sourceLines = [
    ...(sections.achievements || []),
    ...(sections.additional || []).filter((line) => /award|winner|rank|achievement|finalist|hackathon|scholar|medal|honor/i.test(line))
  ];

  return sourceLines
    .map((line) => line.replace(/^[-*]\s*/, "").trim())
    .filter((line) => line.length >= 4)
    .slice(0, 20);
}

function parserDebugSnapshot(sections = {}, parsed = {}) {
  return {
    sectionCounts: Object.fromEntries(Object.entries(sections).map(([key, value]) => [key, Array.isArray(value) ? value.length : 0])),
    extractionCounts: {
      skills: parsed.skills?.length || 0,
      projects: parsed.projects?.length || 0,
      education: parsed.education?.length || 0,
      certifications: parsed.certifications?.length || 0,
      experience: parsed.experience?.length || 0,
      achievements: parsed.achievements?.length || 0,
      links: parsed.links?.length || 0
    },
    sectionPreview: Object.fromEntries(
      Object.entries(sections).map(([key, value]) => [key, Array.isArray(value) ? value.slice(0, 5) : []])
    )
  };
}

function structuredResumeParse(text = "") {
  const rawText = String(text || "");
  const lines = toLines(rawText);
  const sections = splitSections(lines);

  const parsed = {
    fullName: extractFullName(lines),
    email: extractEmail(rawText),
    mobile: extractMobile(rawText),
    summary: extractSummary(sections, lines),
    skills: extractSkills(rawText, sections),
    projects: extractProjects(sections),
    education: extractEducation(sections),
    certifications: extractCertifications(sections),
    experience: extractExperience(sections),
    achievements: extractAchievements(sections),
    links: extractLinks(rawText)
  };

  // Future integration point: replace/augment this with Gemini/OpenAI structured extraction.
  if (process.env.RESUME_PARSER_DEBUG === "true") {
    const snapshot = parserDebugSnapshot(sections, parsed);
    // Keep logs compact and section-oriented for debugging extractor behavior.
    // eslint-disable-next-line no-console
    console.log("[resume-parser] debug", JSON.stringify(snapshot));
  }

  return parsed;
}

module.exports = {
  structuredResumeParse,
  canonicalSkill,
  displaySkill,
  parserDebugSnapshot
};