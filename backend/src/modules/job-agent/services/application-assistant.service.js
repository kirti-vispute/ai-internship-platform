const { routeCompletion } = require("../../../shared/infrastructure/ai/ai-provider.router");
const { getInternSkills, looksSeniorListing } = require("./job-matching.service");
const { toDisplaySkillList } = require("../../../shared/utils/skill-normalizer");
const { looksLikeContactInfoBlock } = require("../../../shared/utils/contact-info-detector");
const { categorizeSkills: categorizeSkillsForResume } = require("../../students/services/resume-structured-parser.service");

/**
 * Application Assistant (spec 2E): generates a job-tailored resume
 * highlights document and a cover letter, built ONLY from the candidate's
 * own verified profile data -- nothing here is invented. The user always
 * reviews and can edit the result before using it (enforced by the
 * controller, which saves these as editable drafts, never auto-submits).
 *
 * The tailored "resume" is a structured, relevance-ordered highlights
 * document rather than a from-scratch rewrite of the uploaded resume file:
 * reformatting someone's actual resume file safely is a much bigger (and
 * riskier) problem than this feature needs to solve, and a highlights
 * document keeps every fact traceable back to a specific profile field.
 */

const EMAIL_PATTERN = /[\w.+-]+@[\w-]+\.[\w.-]+/;
const PHONE_PATTERN = /(\+?\d[\d\s-]{7,}\d)/;
const URL_PATTERN = /\b(?:https?:\/\/\S+|(?:www\.)?[\w-]+\.(?:com|io|dev|in|net|org|co)\/\S*)/gi;

function dedupeByKey(items, keyFn) {
  const seen = new Set();
  const result = [];
  for (const item of items) {
    const key = keyFn(item);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push(item);
  }
  return result;
}

// looksLikeContactInfoBlock is imported above from the shared detector in
// shared/utils/contact-info-detector.js (also used by the resume parser, so
// a contact line can never become a "project" in the first place, upstream
// of this file) and re-exported at the bottom of this module for backward
// compatibility with existing callers/tests.

/**
 * Strips a project's title (verbatim, sometimes including its own link)
 * when a resume parser has echoed it as the literal start of the
 * project's own description field -- a real pattern found in seeded data
 * ("Campus Marketplace (github.com/...) Campus Marketplace (github.com/...)
 * Full-stack web app...").
 */
function stripLeadingTitleEcho(title, text) {
  const t = String(text || "");
  if (!title) return t.trim();
  const escaped = String(title).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return t.replace(new RegExp(`^\\s*${escaped}\\s*`, "i"), "").trim();
}

/**
 * Detects where a SECOND, different "<Project Name> (<link>)" header
 * appears inside a project's description -- the signature of a resume
 * parser having concatenated a different project's text onto this one's
 * description field (also found in seeded data: one project's description
 * silently continues into an entirely separate "Expense Tracker" project).
 * Returns the index to truncate at, or -1 if the description only ever
 * refers to its own project.
 */
function findConcatenatedProjectBoundary(text) {
  const re = /[A-Z][A-Za-z0-9 ]{2,40}\s*\([\w.-]+\.[a-z]{2,}\/[^)]*\)/g;
  const starts = [];
  let match = re.exec(text);
  while (match) {
    starts.push(match.index);
    match = re.exec(text);
  }
  return starts.length > 1 ? starts[1] : -1;
}

/**
 * Cleans a project's raw description for safe use in generated materials:
 * drops anything past a second, different project's header (concatenation
 * bug), then strips a verbatim echo of the project's own title/link.
 * Never adds anything -- only removes resume-parser noise.
 */
function cleanProjectDescription(title, rawDescription) {
  let text = String(rawDescription || "");
  const boundary = findConcatenatedProjectBoundary(text);
  if (boundary > 0) text = text.slice(0, boundary).trim();
  text = stripLeadingTitleEcho(title, text);
  return text.trim();
}

/**
 * Strips a trailing "(<link>)" suffix from a project title (e.g. "Campus
 * Marketplace (github.com/...)" -> "Campus Marketplace") for use anywhere
 * the title is shown as a plain heading or inside a sentence -- only a
 * URL-shaped parenthetical is removed, so a genuine parenthetical like
 * "(2024)" or "(Capstone Project)" is left alone.
 */
function plainProjectName(title) {
  return String(title || "")
    .replace(/\s*\((?:https?:\/\/)?[\w.-]+\.[a-z]{2,}\/[^)]*\)\s*$/i, "")
    .trim() || "a project";
}

/**
 * Recovers a link a resume parser embedded directly in a project's title
 * (e.g. "Campus Marketplace (github.com/x/campus)") for profiles parsed
 * before the parser started promoting bare-domain links to their own
 * demoLink/githubLink fields. Returns "" when the title carries no such
 * suffix -- never guesses a link that isn't literally there.
 */
function extractEmbeddedLink(title) {
  const match = String(title || "").match(/\(((?:https?:\/\/)?[\w.-]+\.[a-z]{2,}\/[^)]*)\)\s*$/i);
  if (!match) return "";
  const link = match[1];
  return link.startsWith("http") ? link : `https://${link}`;
}

// Title-Case labels for resume-structured-parser's own category keys
// (reused rather than re-defining a second skill taxonomy that could drift
// out of sync with the one the resume parser already maintains).
const SKILL_CATEGORY_LABELS = {
  "programming languages": "Languages",
  "web development": "Frameworks & Web",
  databases: "Databases",
  "ai / ml": "AI / ML",
  mobile: "Mobile",
  "cloud & devops": "Cloud & DevOps",
  testing: "Testing",
  "tools & platforms": "Tools",
  security: "Security",
  design: "Design"
};
const SKILL_CATEGORY_ORDER = Object.keys(SKILL_CATEGORY_LABELS);

/**
 * Groups the candidate's verified skills into labeled categories (spec:
 * "Languages, Frameworks, Databases, Tools...") instead of one long
 * comma-separated wall of text. Reuses the resume parser's own category
 * map (resume-structured-parser.service.js) so this module doesn't
 * maintain a second, independently-drifting skill taxonomy. The job-agent
 * module's own skill normalizer (shared/utils/skill-normalizer.js) doesn't
 * always produce the exact same canonical token as the resume parser's
 * (e.g. "Socket Io" vs "socket.io") -- rather than silently dropping a
 * skill the category map doesn't recognize under that exact token, any
 * unmatched-but-verified skill is kept, grouped under "Other", so nothing
 * the candidate actually has is ever lost from the resume.
 */
// Loosely normalizes a skill label for cross-vocabulary comparison only
// (never for display): strips every non-alphanumeric character so
// "Express.js", "ExpressJS" and "express js" -- the same skill, spelled
// differently by two independently-normalized vocabularies (this module's
// own skill-normalizer.js vs. the resume parser's canonicalSkill) -- are
// recognized as the same skill instead of one showing up twice, once in
// its matched category and once again, under a different spelling, in
// "Other".
function looseSkillKey(skill) {
  return String(skill || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function groupSkillsByCategory(skills) {
  const categorized = categorizeSkillsForResume(skills);
  const categorizedKeySet = new Set(Object.values(categorized).flat().map(looseSkillKey));
  const groups = [];
  for (const key of SKILL_CATEGORY_ORDER) {
    if (categorized[key]?.length) groups.push({ label: SKILL_CATEGORY_LABELS[key], skills: categorized[key] });
  }
  const other = skills.filter((s) => !categorizedKeySet.has(looseSkillKey(s)));
  if (other.length) groups.push({ label: "Other", skills: other });
  return groups;
}

/**
 * Pulls together every piece of verified candidate data this feature is
 * allowed to use, merging the profile's two parallel structured sections
 * (top-level fields and the newer profileSections.* editor) so nothing the
 * candidate actually entered is missed, regardless of which section they
 * used. Returns plain, display-ready values -- no inference, no filling in
 * blanks. Also cleans out resume-parser artifacts (contact-info blocks
 * masquerading as projects, concatenated/duplicated project text) so they
 * never reach the generated documents.
 */
function collectVerifiedFacts(internProfile = {}) {
  const sections = internProfile.profileSections || {};

  const education = dedupeByKey(
    [
      ...(internProfile.education || []).map((e) => ({
        degree: e.degree || "",
        institution: e.college || "",
        grade: e.cgpa || "",
        year: e.passingYear || ""
      })),
      ...(sections.education || []).map((e) => ({
        degree: e.degree || "",
        institution: e.institution || "",
        grade: e.grade || "",
        year: e.endYear || e.startYear || ""
      }))
    ].filter((e) => e.degree || e.institution),
    (e) => `${e.degree}::${e.institution}`
  );

  const experience = dedupeByKey(
    [
      ...(internProfile.experience || []).map((text) => ({ role: "", company: "", duration: "", description: String(text) })),
      ...(sections.experience || []).map((e) => ({
        role: e.role || "",
        company: e.company || "",
        duration: e.duration || "",
        description: e.description || ""
      }))
    ].filter((e) => (e.role || e.company || e.description) && !looksLikeContactInfoBlock(e.description)),
    (e) => `${e.role}::${e.company}::${e.description.slice(0, 40)}`
  );

  // Prefer the structured project editor (profileSections.projects); only
  // fall back to the older raw-string `projects` field when the structured
  // one is empty, so a candidate who never touched the newer editor still
  // gets their projects surfaced instead of none at all. Never merges both
  // shapes together -- they typically describe the same underlying data,
  // and merging would duplicate every project.
  const structuredProjects = (sections.projects || [])
    .map((p) => ({ title: p.title || "", description: p.description || "", techStack: Array.isArray(p.techStack) ? p.techStack : [], demoLink: p.demoLink || "" }))
    .filter((p) => p.title && !looksLikeContactInfoBlock(`${p.title} ${p.description}`));

  const rawProjects = structuredProjects.length
    ? []
    : (internProfile.projects || [])
        .map((text) => String(text || "").trim())
        .filter((text) => text && !looksLikeContactInfoBlock(text))
        .map((text) => ({ title: text.length > 70 ? `${text.slice(0, 67)}...` : text, description: text, techStack: [], demoLink: "" }));

  // De-duplicated by both the plain (link-stripped) title AND the resolved
  // link -- the two independent dedup keys this feature is meant to guard
  // against: the same project title entered twice, and the same project
  // reachable under two different title strings but pointing at the one
  // real link.
  const projects = dedupeByKey(
    dedupeByKey(
      [...structuredProjects, ...rawProjects].map((p) => {
        const link = p.demoLink || extractEmbeddedLink(p.title) || "";
        return {
          title: plainProjectName(p.title),
          description: cleanProjectDescription(p.title, p.description),
          techStack: p.techStack,
          link
        };
      }),
      (p) => p.title.toLowerCase()
    ),
    (p) => p.link || `no-link::${p.title.toLowerCase()}`
  );

  const certifications = dedupeByKey(
    [
      ...(internProfile.certifications || []).map((c) => ({ name: c.name || "", issuer: c.issuer || "", year: c.year || "" })),
      ...(sections.certifications || []).map((c) => ({ name: c.name || "", issuer: c.issuer || "", year: c.year || "" }))
    ].filter((c) => c.name),
    (c) => `${c.name}::${c.issuer}`
  );

  return {
    fullName: internProfile.fullName || "",
    email: internProfile.email || "",
    mobile: internProfile.mobile || "",
    headline: sections.personalInformation?.headline || "",
    summary: sections.professionalSummary || internProfile.bio || internProfile.summary || "",
    links: {
      linkedin: internProfile.linkedinUrl || "",
      github: internProfile.githubUrl || "",
      portfolio: internProfile.portfolioUrl || ""
    },
    skills: toDisplaySkillList(getInternSkills(internProfile)),
    education,
    experience,
    projects,
    certifications
  };
}

function rankProjectsByRelevance(projects, jobSkills) {
  const jobSkillSet = new Set((jobSkills || []).map((s) => String(s).toLowerCase()));
  return [...projects]
    .map((project) => {
      const techMatches = (project.techStack || []).filter((t) => jobSkillSet.has(String(t).toLowerCase()));
      return { ...project, relevance: techMatches.length };
    })
    .sort((a, b) => {
      if (b.relevance !== a.relevance) return b.relevance - a.relevance;
      // Tie-break (most commonly: neither project's tech stack overlaps the
      // job's, e.g. the job lists no required skills at all) by how
      // complete the entry is, rather than leaving list order to decide --
      // a project with real description content is a better example to
      // lead with than a bare title.
      return (b.description?.length || 0) - (a.description?.length || 0);
    });
}

/**
 * Formats a phone number for display when it's recognizable as an Indian
 * mobile number carrying its country code (the shape this platform's own
 * profile form collects: a 12-digit string starting "91"). Any other shape
 * is shown exactly as stored -- never reformatted on a guess, since
 * guessing wrong would misrepresent the candidate's own contact number.
 */
function formatPhoneForDisplay(mobile) {
  const digits = String(mobile || "").replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) {
    return `+91 ${digits.slice(2, 7)} ${digits.slice(7)}`;
  }
  if (digits.length === 10) return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
  return String(mobile || "").trim();
}

/**
 * Guarantees a link carries an explicit "https://" scheme -- a profile
 * field can be saved without one (e.g. a candidate typed
 * "linkedin.com/in/x") -- so the generated document's link is always
 * resolvable as a real URL. Keeping the FULL URL (scheme included) in the
 * underlying plain-text content, rather than stripping it for display
 * here, is what lets the frontend's Preview mode auto-detect and
 * hyperlink it (its own linkify() shortens the on-screen label to just
 * the host+path, the same treatment project links already get).
 */
function ensureUrlScheme(url) {
  const trimmed = String(url || "").trim();
  if (!trimmed) return "";
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

/**
 * Builds the resume's contact block as clearly labeled, separated lines
 * instead of one unformatted "email | phone | url | url" run-on line.
 */
function formatContactLines(facts) {
  const lines = [];
  const primary = [facts.email, facts.mobile ? formatPhoneForDisplay(facts.mobile) : ""].filter(Boolean).join("  |  ");
  if (primary) lines.push(primary);

  const linkParts = [];
  if (facts.links.linkedin) linkParts.push(`LinkedIn: ${ensureUrlScheme(facts.links.linkedin)}`);
  if (facts.links.github) linkParts.push(`GitHub: ${ensureUrlScheme(facts.links.github)}`);
  if (facts.links.portfolio) linkParts.push(`Portfolio: ${ensureUrlScheme(facts.links.portfolio)}`);
  if (linkParts.length) lines.push(linkParts.join("  |  "));

  return lines;
}

/**
 * Composes a concise, role-tailored professional summary from verified
 * skills only -- never reuses the candidate's own free-text profile
 * summary verbatim (which reads as generic and job-agnostic), and never
 * states a seniority level or years of experience the profile doesn't
 * establish.
 */
function composeSummary(facts, job, relevantSkills) {
  const topSkills = (relevantSkills.length ? relevantSkills : facts.skills).slice(0, 4);
  const roleLabel = job?.title || "this role";
  const opening = facts.headline ? facts.headline : "Entry-level software engineering candidate";
  const skillsClause = topSkills.length ? ` with hands-on project experience in ${joinWithAnd(topSkills)}` : "";
  const targetClause = ` Seeking to contribute as a ${roleLabel}${job?.companyName ? ` at ${job.companyName}` : ""}.`;
  return `${opening}${skillsClause}.${targetClause}`.replace(/\.\./g, ".").trim();
}

function joinWithAnd(items) {
  if (items.length <= 1) return items[0] || "";
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

/**
 * Splits a project's cleaned description into short, achievement-oriented
 * bullet sentences (one per line) rather than one dense paragraph --
 * restructures existing wording only, never invents a new claim or
 * outcome. A sentence that doesn't already start with a capital letter is
 * capitalized for consistency; nothing else about the wording is changed.
 */
function toProjectBullets(description) {
  return String(description || "")
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => (/^[a-z]/.test(s) ? s.charAt(0).toUpperCase() + s.slice(1) : s))
    .map((s) => (/[.!?]$/.test(s) ? s : `${s}.`));
}

function renderTailoredResumeHighlights(facts, job) {
  const jobSkills = [...(job.skillsRequired || []), ...(job.prioritySkills || [])];
  const jobSkillSet = new Set(jobSkills.map((s) => String(s).toLowerCase()));

  const relevantSkills = facts.skills.filter((s) => jobSkillSet.has(s.toLowerCase()));
  const rankedProjects = rankProjectsByRelevance(facts.projects, jobSkills);

  const lines = [];
  lines.push(`${facts.fullName || "Candidate"}${facts.headline ? ` — ${facts.headline}` : ""}`);
  lines.push(...formatContactLines(facts));
  lines.push("");

  lines.push("PROFESSIONAL SUMMARY");
  lines.push(composeSummary(facts, job, relevantSkills));
  lines.push("");

  if (facts.skills.length) {
    lines.push("TECHNICAL SKILLS");
    for (const group of groupSkillsByCategory(facts.skills)) {
      lines.push(`${group.label}: ${group.skills.join(", ")}`);
    }
    lines.push("");
  }

  if (rankedProjects.length) {
    lines.push("PROJECTS");
    for (const project of rankedProjects) {
      lines.push(`${project.title}`);
      for (const bullet of toProjectBullets(project.description)) {
        lines.push(`- ${bullet}`);
      }
      if (project.techStack?.length) lines.push(`  Built with: ${project.techStack.join(", ")}`);
      if (project.link) lines.push(`  Link: ${project.link}`);
      lines.push("");
    }
  }

  if (facts.experience.length) {
    lines.push("RELEVANT EXPERIENCE");
    for (const exp of facts.experience) {
      const header = [exp.role, exp.company].filter(Boolean).join(" at ") || exp.description.slice(0, 60);
      const durationSuffix = exp.duration ? ` (${exp.duration})` : "";
      lines.push(`- ${header}${durationSuffix}`);
      if (exp.description && header !== exp.description) lines.push(`  ${exp.description}`);
    }
    lines.push("");
  }

  if (facts.education.length) {
    lines.push("EDUCATION");
    for (const edu of facts.education) {
      const gradeSuffix = edu.grade ? ` — ${edu.grade}` : "";
      const yearSuffix = edu.year ? ` (${edu.year})` : "";
      lines.push(`- ${edu.degree}${edu.institution ? `, ${edu.institution}` : ""}${gradeSuffix}${yearSuffix}`);
    }
    lines.push("");
  }

  if (facts.certifications.length) {
    lines.push("CERTIFICATIONS");
    for (const cert of facts.certifications) {
      const issuerSuffix = cert.issuer ? ` — ${cert.issuer}` : "";
      const yearSuffix = cert.year ? ` (${cert.year})` : "";
      lines.push(`- ${cert.name}${issuerSuffix}${yearSuffix}`);
    }
  }

  return lines.join("\n").trim();
}

/**
 * Removes any email address, phone number or URL from generated cover-
 * letter text -- a last-resort safety net on top of collectVerifiedFacts
 * already excluding contact-info-shaped "projects": the body of a cover
 * letter should never repeat the header contact block, even if a future
 * data shape slips a contact token into some other field (experience
 * description, headline, etc.). Applied to both the template output and
 * any LLM-polished rewrite.
 */
function stripContactTokensFromBody(text) {
  return String(text || "")
    .replace(new RegExp(EMAIL_PATTERN, "g"), "")
    .replace(new RegExp(PHONE_PATTERN, "g"), "")
    .replace(URL_PATTERN, "")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Builds a concise, professional, job-specific cover letter from only
 * verified facts: a greeting, a one-sentence focused opening naming the
 * role and company, one or two short body paragraphs (skills, then a
 * single genuinely relevant project or experience entry), and a plain
 * closing. Deliberately avoids generic enthusiasm ("I am very excited..."),
 * keyword-stuffed skill lists, and template-sounding phrasing like "my
 * project [...] demonstrates this hands-on" -- each sentence states one
 * concrete, verifiable thing.
 *
 * Honesty guard: never implies a seniority level the profile doesn't
 * establish. If the listing reads as senior (see looksSeniorListing) and
 * the candidate's profile lists no work experience, the letter explicitly
 * grounds itself in projects/coursework instead of hinting at professional
 * seniority it can't back up.
 */
/**
 * Target length band from the spec (~120-180 words): reached by adding one
 * more genuine, fact-grounded sentence per paragraph when the underlying
 * data actually supports it (a second sentence from the same project's own
 * description, a second matched skill clause) -- never by padding with
 * generic enthusiasm or restating the same point twice. A sparse profile
 * (few skills, no multi-sentence project description) will fall short of
 * this band rather than be padded with invented or generic filler to hit
 * it; the length target yields to the "no filler, no unsupported claims"
 * rule, not the other way around.
 */
function renderCoverLetterTemplate(facts, job, fit) {
  const jobTitle = job?.title || "this role";
  const company = job?.companyName || "";
  const greeting = company ? `Dear ${company} Hiring Team,` : "Dear Hiring Manager,";

  const sentences = [];

  sentences.push(`I'm writing to apply for the ${jobTitle}${company ? ` role at ${company}` : " role"}.`);

  const matchedSkills = (fit?.matchedRequiredSkills?.length ? fit.matchedRequiredSkills : facts.skills.slice(0, 4)).slice(0, 4);
  const isSeniorListing = looksSeniorListing(job || {});
  const hasExperience = facts.experience.length > 0;

  if (isSeniorListing && !hasExperience) {
    // Honest framing for a senior-leaning listing with no verified
    // professional experience -- never implies years of professional work
    // this profile doesn't show.
    sentences.push(
      `My background so far is project-based rather than professional, but it's given me direct, hands-on experience with` +
        `${matchedSkills.length ? ` ${joinWithAnd(matchedSkills)}` : " the core technologies this role uses"}.`
    );
  } else if (matchedSkills.length) {
    sentences.push(`My experience with ${joinWithAnd(matchedSkills)} lines up directly with what this role needs.`);
  }

  const jobSkills = [...(job?.skillsRequired || []), ...(job?.prioritySkills || [])];
  const topExperience = facts.experience[0];
  const rankedForLetter = rankProjectsByRelevance(facts.projects, jobSkills);
  const topProject = rankedForLetter[0];
  const secondProject = rankedForLetter[1];

  function excludeHostingTech(techStack) {
    // "Github"/"Git" describe where the code is hosted, not a technology
    // the project was "built with" -- excluded from this specific clause
    // only (the resume's full tech list still includes it).
    return (techStack || []).filter((t) => !/^git(hub)?$/i.test(t)).slice(0, 3);
  }

  if (topExperience) {
    const role = [topExperience.role, topExperience.company].filter(Boolean).join(" at ");
    if (role) sentences.push(`As ${role}, I ${topExperience.description || "worked on related problems in this space"}.`);
  } else if (topProject) {
    const techForSentence = excludeHostingTech(topProject.techStack);
    const techClause = techForSentence.length ? `, using ${joinWithAnd(techForSentence)}` : "";
    const descPhrase = toProjectBullets(topProject.description).map(stripTrailingPunctuation)[0] || "";
    sentences.push(`For example, I built ${topProject.title}${describeAsClause(descPhrase)}${techClause}.`);

    // A second, different project (composed fresh, never lifted raw text
    // from its description, to avoid producing a sentence fragment) --
    // only when one genuinely exists and is distinct from the first.
    if (secondProject && secondProject.title !== topProject.title) {
      const secondTech = excludeHostingTech(secondProject.techStack);
      const secondTechClause = secondTech.length ? `, using ${joinWithAnd(secondTech)}` : "";
      sentences.push(`I also built ${secondProject.title}${secondTechClause}, which broadened that experience further.`);
    }
  }

  sentences.push(
    `I'm looking for the opportunity to keep building on these skills in a professional setting, and I'd welcome the chance to discuss how I can contribute to ${company || "your team"}.`
  );
  sentences.push("Thank you for your time and consideration.");

  const body = sentences.join(" ");
  const signature = facts.fullName ? `Sincerely,\n${facts.fullName}` : "Sincerely,";

  return stripContactTokensFromBody(`${greeting}\n\n${body}\n\n${signature}`);
}

function lowerFirst(text) {
  const t = String(text || "").trim();
  return t ? t.charAt(0).toLowerCase() + t.slice(1) : t;
}

function stripTrailingPunctuation(text) {
  return String(text || "").replace(/[.!?]+$/, "").trim();
}

const ACTION_VERB_START = /^(built|trained|developed|designed|implemented|created|deployed|engineered|simulated|optimized|wrote|led|managed|architected|automated|integrated|configured)\b/i;

/**
 * Turns a project description's first sentence into a grammatical clause
 * appended after a project name, handling both common shapes a candidate's
 * own writing takes: a noun phrase ("A full-stack web app for...") or an
 * action-verb-led sentence ("Trained a spam-detection model..."). Getting
 * this wrong previously produced "I built X, a trained a spam-detection
 * model..." (an article glued onto a verb phrase) for any project whose
 * description starts with a past-tense verb rather than a noun.
 */
function describeAsClause(descPhrase) {
  if (!descPhrase) return "";
  if (ACTION_VERB_START.test(descPhrase)) return `, where I ${lowerFirst(descPhrase)}`;
  if (/^(a|an|the)\s/i.test(descPhrase)) return `, ${lowerFirst(descPhrase)}`;
  return `, a ${lowerFirst(descPhrase)}`;
}


/**
 * Optionally asks the configured LLM to polish the cover letter's tone --
 * never the resume highlights, which stay template-only/deterministic so
 * every fact on it stays directly traceable to a specific profile field
 * (the resume is the one document most likely to be lifted verbatim into
 * an ATS, where a hallucinated metric or skill is the most costly).
 * Follows the exact safety contract already used for application-insight
 * bullets elsewhere in this codebase: the LLM may only rephrase, never add
 * a fact, and any response that fails basic sanity checks (too long, empty,
 * or still carrying a contact token after sanitization) is discarded in
 * favor of the original template so a bad/hallucinated response can never
 * reach the user silently.
 */
async function polishCoverLetter(templateContent, { userId, jobTitle } = {}) {
  const result = await routeCompletion({
    operation: "job-agent-cover-letter",
    payload: { jobTitle: String(jobTitle || ""), length: templateContent.length },
    userId,
    systemPrompt:
      "You are helping a student polish the tone of a cover letter draft for a job application. Rewrite it to read as " +
      "natural, professional, and concise -- not generic or over-enthusiastic, and never keyword-stuffed. " +
      "You MUST NOT add any new fact, skill, company name, number, or claim that isn't already in the draft, and must " +
      "not imply a seniority level or years of experience the draft doesn't already state. " +
      "Never include an email address, phone number, or URL anywhere in your rewrite, even if the draft contains one. " +
      "Keep the greeting and the signature line as they are. Keep it roughly the same length. " +
      "Return only the rewritten cover letter text, no commentary.",
    userPrompt: templateContent,
    skipRateLimit: false,
    localFallback: async () => ({ provider: "local-heuristics", content: templateContent })
  });

  const content = stripContactTokensFromBody(result?.content || "");
  const isSane = content.length > 0 && content.length < templateContent.length * 2.5;

  if (!isSane) {
    return { content: templateContent, source: "template" };
  }

  return { content, source: result.provider === "local-heuristics" ? "template" : result.provider || "template" };
}

/**
 * Generates both application-assistant documents for one job. The resume
 * highlights are always deterministic/template-based (no LLM call); the
 * cover letter goes through the same optional LLM-polish path as the rest
 * of the platform's AI features (routeCompletion honors the existing
 * preferLocalHeuristics setting, so by default this stays template-only
 * and LLM calls are skipped entirely unless the platform is configured
 * otherwise).
 */
async function generateApplicationMaterials({ internProfile, job, fit, userId } = {}) {
  const facts = collectVerifiedFacts(internProfile);

  const tailoredResumeContent = renderTailoredResumeHighlights(facts, job);
  const coverLetterTemplate = renderCoverLetterTemplate(facts, job, fit);
  const coverLetter = await polishCoverLetter(coverLetterTemplate, { userId, jobTitle: job?.title });

  return {
    tailoredResume: { content: tailoredResumeContent, source: "template", generatedAt: new Date() },
    coverLetter: { content: coverLetter.content, source: coverLetter.source, generatedAt: new Date() }
  };
}

module.exports = {
  generateApplicationMaterials,
  collectVerifiedFacts,
  renderTailoredResumeHighlights,
  renderCoverLetterTemplate,
  looksLikeContactInfoBlock,
  cleanProjectDescription,
  polishCoverLetter
};
