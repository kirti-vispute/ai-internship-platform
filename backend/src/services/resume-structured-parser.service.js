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
  html: "html",
  css: "css",
  nodejs: "node.js",
  "node js": "node.js",
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
  html: "HTML",
  css: "CSS",
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
  "data analysis", "data structure", "oops", "excel", "power bi", "tableau", "tensorflow", "pytorch", "scikit-learn",
  "pandas", "numpy", "figma", "postman", "matplotlib", "azure", "microsoft azure", "data mining", "data warehousing"
]);

const DEGREE_REGEX = /\b(?:b\.?\s?tech|m\.?\s?tech|b\.?\s?e|m\.?\s?e|bca|mca|bsc|msc|mba|ph\.?d|diploma|bachelor[^,|;]*|master[^,|;]*|higher secondary|secondary school)\b/i;
const INSTITUTE_REGEX = /(university|college|institute|school|academy|polytechnic|vidyalankar|mahavidyalaya)/i;
const PROJECT_ACTION_REGEX = /(developed|built|designed|implemented|deployed|trained|created|engineered|simulated|optimized)/i;

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
    .filter(Boolean)
    .filter((line) => !/^--\s*\d+\s+of\s+\d+\s*--$/i.test(line));
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

function classifyLine(line = "") {
  const lower = line.toLowerCase();

  if (/^languages?\s*:/i.test(line)) return "additional";
  if (/award|winner|rank|achievement|finalist|hackathon|scholar|medal|honor|1st place|2nd place|3rd place|competition/i.test(line)) return "achievements";
  if (/demo\s*link|github\.com|portfolio|behance|dribbble|linkedin\.com/i.test(line)) return "projects";
  if (/tech\s*stack|technologies?\s*:/i.test(line)) return "skills";
  if (DEGREE_REGEX.test(line) || INSTITUTE_REGEX.test(line) || /cgpa|gpa|semester|aggregate|percentage|%/i.test(line) || /\b(?:19|20)\d{2}\s*-\s*(?:19|20)\d{2}\b/.test(line)) return "education";
  if (/cert|credential|course completion|nptel|coursera|udemy/i.test(lower)) return "certifications";
  if (/intern|internship|experience|worked at|company|role|responsibilit/i.test(lower)) return "experience";
  if (/^[A-Z][A-Za-z0-9 '&()+.#/-]{2,70}$/.test(line) && /(model|simulator|application|app|system|prediction|dashboard|portal)/i.test(line)) return "projects";
  if (PROJECT_ACTION_REGEX.test(line)) return "projects";

  const skillTokens = line
    .split(/[|,;/()]/)
    .map((token) => token.trim())
    .filter(Boolean)
    .map(canonicalSkill)
    .filter(Boolean);
  if (skillTokens.some((token) => KNOWN_SKILLS.has(token))) return "skills";

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

    // Recover from mixed-order PDFs by semantic reassignment.
    const semantic = classifyLine(line);
    const target = semantic || current;
    sections[target].push(line);
  }

  return sections;
}

function extractEmail(text = "") {
  const match = String(text).match(EMAIL_REGEX);
  return match ? match[0].toLowerCase() : "";
}

function extractMobile(text = "") {
  const matches = [...String(text).matchAll(new RegExp(PHONE_REGEX.source, "g"))].map((m) => m[0]);
  const candidate = matches
    .map((value) => value.replace(/[^\d]/g, ""))
    .filter((digits) => digits.length >= 10 && digits.length <= 12)
    .sort((a, b) => b.length - a.length)[0];
  return candidate || "";
}

function extractLinks(text = "") {
  const links = String(text).match(URL_REGEX) || [];
  return [...new Set(links.map((link) => (link.startsWith("http") ? link : `https://${link}`)))];
}

function extractLocation(lines = []) {
  const cityLine = lines.find((line) => /(mumbai|nagpur|pune|india)/i.test(line) && !INSTITUTE_REGEX.test(line));
  if (!cityLine) return "";
  const match = cityLine.match(/([A-Za-z\s]+,\s*(?:India|Maharashtra|Mumbai|Nagpur|Pune))/i);
  return match ? cleanLine(match[1]) : cleanLine(cityLine);
}

function extractFullName(lines = []) {
  const candidates = lines.slice(0, 16);
  for (const line of candidates) {
    if (EMAIL_REGEX.test(line) || PHONE_REGEX.test(line) || URL_REGEX.test(line)) continue;
    const words = line.split(/\s+/).filter(Boolean);
    if (words.length < 2 || words.length > 5) continue;
    if (!/^[a-zA-Z.\s]+$/.test(line)) continue;
    if (line.toUpperCase() === line || /^[A-Z][a-z]+\s+[A-Z][a-z]+/.test(line)) return line.trim();
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

function collectSkillCandidates(sourceLines = []) {
  const tokens = [];
  for (const line of sourceLines) {
    const parts = line
      .split(/[|,;/()]/)
      .map((part) => part.replace(/^[-*]\s*/, "").trim())
      .filter(Boolean);

    for (const part of parts) {
      const normalized = canonicalSkill(part);
      if (normalized) tokens.push(normalized);
    }
  }
  return tokens;
}

function extractSkills(rawText = "", sections = {}, extraSource = "") {
  const skillLines = [
    ...(sections.skills || []),
    ...((sections.projects || []).filter((line) => /tech\s*stack|using|technologies?/i.test(line))),
    ...((sections.additional || []).filter((line) => /skill|tech/i.test(line)))
  ];

  const normalized = new Set();
  for (const token of collectSkillCandidates(skillLines)) {
    if (KNOWN_SKILLS.has(token)) normalized.add(token);
  }

  const fullText = `${rawText}\n${extraSource}`.toLowerCase();
  for (const skill of KNOWN_SKILLS) {
    const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (new RegExp(`\\b${escaped}\\b`, "i").test(fullText)) {
      normalized.add(skill);
    }
  }

  return [...normalized].map(displaySkill).sort((a, b) => a.localeCompare(b));
}

function extractSummary(sections = {}, lines = []) {
  const explicit = sections.summary || [];
  if (explicit.length > 0) {
    const long = explicit.filter((line) => line.length > 60);
    if (long.length > 0) return long.slice(0, 3).join(" ");
    return explicit.slice(0, 4).join(" ");
  }

  const candidate = lines.find((line) => line.length > 80 && !detectSection(line) && !EMAIL_REGEX.test(line));
  return candidate || "";
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

  for (const rawLine of lines) {
    const line = rawLine.replace(/^[-*]\s+|^\d+[.)]\s+/, "").trim();
    if (!line) continue;

    const startNew =
      (/^[A-Z][A-Za-z0-9 '&()+.#/-]{2,70}$/.test(line) && !PROJECT_ACTION_REGEX.test(line) && !/tech stack|demo link/i.test(line)) ||
      /^project\s*[:\-]/i.test(line);

    if (startNew && current.length > 0) flush();
    current.push(line);
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

function extractProjects(sections = {}) {
  const projectLines = [
    ...(sections.projects || []),
    ...((sections.additional || []).filter((line) => /demo\s*link|github\.com|deployed|developed|built|model|simulator|prediction/i.test(line))),
    ...((sections.education || []).filter((line) => /demo\s*link|deployed|developed|built|trained|model|simulator|prediction/i.test(line)))
  ];

  if (projectLines.length === 0) return [];

  return splitBlocks(projectLines)
    .slice(0, 12)
    .map((block, index) => {
      const combined = block.join(" ");
      const first = block[0] || "";

      let title = first.replace(/^project\s*[:\-]?/i, "").trim();
      if (title.length < 3 || /developed|built|trained|used/i.test(title)) {
        const titleCandidate = block.find((line) => line.split(" ").length <= 8 && !PROJECT_ACTION_REGEX.test(line) && !/tech stack|demo link/i.test(line));
        title = titleCandidate || `Project ${index + 1}`;
      }

      const demoMatch = combined.match(/https?:\/\/[^\s)]+|www\.[^\s)]+/i);
      const demoLink = demoMatch ? (demoMatch[0].startsWith("http") ? demoMatch[0] : `https://${demoMatch[0]}`) : "";

      const techMatch = combined.match(/(?:tech(?:nologies|\s*stack)?|stack|built with|using)\s*[:\-]\s*([^.;]+)/i);
      const techStack = techMatch ? extractTechStack(techMatch[1]) : extractTechStack(combined);

      return {
        title: cleanLine(title),
        description: combined,
        techStack,
        demoLink
      };
    })
    .filter((item) => item.title || item.description)
    .filter((item, idx, arr) => arr.findIndex((cmp) => cmp.title === item.title) === idx);
}

function extractEducation(sections = {}) {
  const source = [...(sections.education || []), ...(sections.additional || []).filter((line) => /cgpa|%|semester|higher secondary|secondary/i.test(line))];
  if (source.length === 0) return [];

  const items = [];
  let current = null;

  const flush = () => {
    if (!current) return;
    if (current.degree || current.institution || current.grade || current.startYear || current.endYear) {
      items.push({ ...current, raw: current.raw.filter(Boolean).join(" | ") });
    }
    current = null;
  };

  for (const line of source) {
    if (/demo\s*link|developed|built|trained|model|simulator|prediction/i.test(line)) continue;
    if (/detail-oriented|proven ability|eager to|data-driven/i.test(line)) continue;

    const years = line.match(YEAR_REGEX) || [];
    const degreeMatch = line.match(DEGREE_REGEX);
    const gradeMatch = line.match(/(?:cgpa|gpa|grade|percentage|percent|aggregate)\s*[:\-]?\s*([0-9]+(?:\.[0-9]+)?\s*%?)/i);
    const looksInstitution = INSTITUTE_REGEX.test(line) && line.split(/\s+/).length <= 10 && !/[.]/.test(line) && !/student/i.test(line);
    const newEntry = Boolean(degreeMatch || looksInstitution || /higher secondary|secondary school/i.test(line));

    if (newEntry) {
      flush();
      current = {
        degree: degreeMatch ? cleanLine(degreeMatch[0]) : "",
        institution: looksInstitution ? cleanLine(line) : "",
        startYear: years[0] || "",
        endYear: years[1] || years[0] || "",
        grade: gradeMatch ? cleanLine(gradeMatch[1]) : "",
        raw: [line]
      };
      continue;
    }

    if (!current) continue;
    if (/^[A-Z][A-Za-z0-9 '&()+.#/-]{2,70}$/.test(line) && /(model|simulator|application|app|system|prediction)/i.test(line)) {
      flush();
      continue;
    }
    current.raw.push(line);
    if (!current.startYear && years[0]) current.startYear = years[0];
    if (!current.endYear && (years[1] || years[0])) current.endYear = years[1] || years[0];
    if (!current.grade && gradeMatch) current.grade = cleanLine(gradeMatch[1]);
    if (!current.institution && INSTITUTE_REGEX.test(line)) current.institution = cleanLine(line);

    if (!current.institution && /[:]/.test(line) && !/cgpa|gpa|aggregate/i.test(line)) {
      current.institution = cleanLine(line.split(":")[0]);
      if (!current.grade) {
        const inlineGrade = line.match(/([0-9]+(?:\.[0-9]+)?\s*%?)/);
        if (inlineGrade) current.grade = cleanLine(inlineGrade[1]);
      }
    }
  }
  flush();

  return items
    .filter((item) => !/competition|innovation lounge|hackathon/i.test(item.raw))
    .filter((item) => !/detail-oriented|proven ability|student at/i.test(item.raw))
    .filter((item, idx, arr) => arr.findIndex((cmp) => cmp.raw === item.raw) === idx);
}

function extractCertifications(sections = {}) {
  const lines = [
    ...(sections.certifications || []),
    ...((sections.additional || []).filter((line) => /cert|credential|course completion|workshop/i.test(line)))
  ];

  if (lines.length === 0) return [];

  return splitBlocks(lines)
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
  const lines = sections.experience || [];
  if (lines.length === 0) return [];

  return splitBlocks(lines)
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

function extractAchievementsAndLanguages(sections = {}) {
  const lines = [...(sections.achievements || []), ...(sections.additional || []), ...(sections.education || [])];

  const achievements = [];
  const languages = [];

  for (const raw of lines) {
    const line = raw.replace(/^[-*]\s*/, "").trim();
    if (!line) continue;

    if (/^languages?\s*:/i.test(line)) {
      const values = line
        .split(":")
        .slice(1)
        .join(":")
        .split(/[|,;/]/)
        .map((item) => cleanLine(item))
        .filter(Boolean);
      languages.push(...values);
      continue;
    }

    if (/award|winner|rank|achievement|finalist|hackathon|scholar|medal|honor|place/i.test(line)) {
      achievements.push(line);
    }
  }

  return {
    achievements: [...new Set(achievements)].slice(0, 20),
    languages: [...new Set(languages)].slice(0, 20)
  };
}

function parserDebugSnapshot(sections = {}, parsed = {}, rawText = "") {
  return {
    rawPreview: String(rawText || "").split(/\n/).slice(0, 60),
    sectionCounts: Object.fromEntries(Object.entries(sections).map(([key, value]) => [key, Array.isArray(value) ? value.length : 0])),
    extractionCounts: {
      skills: parsed.skills?.length || 0,
      projects: parsed.projects?.length || 0,
      education: parsed.education?.length || 0,
      certifications: parsed.certifications?.length || 0,
      experience: parsed.experience?.length || 0,
      achievements: parsed.achievements?.length || 0,
      languages: parsed.languages?.length || 0,
      links: parsed.links?.length || 0
    },
    sectionPreview: Object.fromEntries(
      Object.entries(sections).map(([key, value]) => [key, Array.isArray(value) ? value.slice(0, 12) : []])
    )
  };
}

function structuredResumeParse(text = "") {
  const rawText = String(text || "");
  const lines = toLines(rawText);
  const sections = splitSections(lines);

  const projects = extractProjects(sections);
  const projectText = projects.map((project) => `${project.title} ${project.description} ${project.techStack.join(" ")}`).join("\n");
  const skills = extractSkills(rawText, sections, projectText);
  const education = extractEducation(sections);
  const certs = extractCertifications(sections);
  const experience = extractExperience(sections);
  const { achievements, languages } = extractAchievementsAndLanguages(sections);

  const parsed = {
    fullName: extractFullName(lines),
    email: extractEmail(rawText),
    mobile: extractMobile(rawText),
    location: extractLocation(lines),
    summary: extractSummary(sections, lines),
    skills,
    projects,
    education,
    certifications: certs,
    experience,
    achievements,
    languages,
    links: extractLinks(rawText)
  };

  // Future integration point: replace/augment this with Gemini/OpenAI structured extraction.
  if (process.env.RESUME_PARSER_DEBUG === "true") {
    const snapshot = parserDebugSnapshot(sections, parsed, rawText);
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
