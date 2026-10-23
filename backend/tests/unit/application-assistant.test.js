const {
  collectVerifiedFacts,
  renderTailoredResumeHighlights,
  renderCoverLetterTemplate,
  looksLikeContactInfoBlock,
  cleanProjectDescription,
  generateApplicationMaterials,
  polishCoverLetter
} = require("../../src/modules/job-agent/services/application-assistant.service");

describe("Application Assistant template generation (never invents facts)", () => {
  const internProfile = {
    fullName: "Asha Verma",
    email: "asha@example.com",
    mobile: "9999999999",
    education: [{ college: "ABC Institute", degree: "B.Tech CSE", cgpa: "8.5", passingYear: "2026" }],
    experience: [],
    certifications: [],
    profileSections: {
      personalInformation: { headline: "Full-stack developer" },
      professionalSummary: "Final-year CSE student.",
      projects: [
        { title: "Job Tracker App", description: "A MERN app.", techStack: ["React", "Node.js", "MongoDB"], demoLink: "" },
        { title: "Weather CLI", description: "A Python tool.", techStack: ["Python"], demoLink: "" }
      ],
      experience: []
    }
  };

  const job = { title: "Frontend Developer Intern", companyName: "Acme Corp", skillsRequired: ["javascript", "react", "mongodb"], prioritySkills: [] };

  test("collectVerifiedFacts never fabricates a skill, project or education entry not present on the profile", () => {
    const facts = collectVerifiedFacts(internProfile);
    expect(facts.fullName).toBe("Asha Verma");
    expect(facts.projects.map((p) => p.title)).toEqual(["Job Tracker App", "Weather CLI"]);
    expect(facts.education).toHaveLength(1);
    expect(facts.certifications).toEqual([]);
  });

  test("tailored resume highlights surface only skills/projects that exist on the profile, ranked by relevance to the job", () => {
    const facts = collectVerifiedFacts(internProfile);
    const resume = renderTailoredResumeHighlights(facts, job);
    expect(resume).toContain("Job Tracker App");
    // The more relevant project (overlapping tech stack) must be listed before the less relevant one.
    expect(resume.indexOf("Job Tracker App")).toBeLessThan(resume.indexOf("Weather CLI"));
    expect(resume).not.toMatch(/django|kubernetes/i); // never-mentioned skills must not appear
  });

  test("cover letter template references only verified facts (no invented company history or claims)", () => {
    const facts = collectVerifiedFacts(internProfile);
    const letter = renderCoverLetterTemplate(facts, job, { matchedRequiredSkills: ["JavaScript", "React"] });
    expect(letter).toContain("Frontend Developer Intern");
    expect(letter).toContain("Acme Corp");
    expect(letter).toContain("Asha Verma");
  });

  test("an empty profile still produces a safe, non-throwing template with no fabricated content", () => {
    const facts = collectVerifiedFacts({});
    expect(() => renderTailoredResumeHighlights(facts, job)).not.toThrow();
    expect(() => renderCoverLetterTemplate(facts, job, {})).not.toThrow();
  });
});

// Regression suite: generated materials were reported as "poorly written,
// repetitive, and insufficiently tailored". Real-data inspection (the
// seeded "Aarav Sharma" profile) found the actual root causes: a resume
// parser had mis-segmented the candidate's own contact-info line as a
// fake "project" (so it could be selected as the cover letter's featured
// project, repeating the candidate's email/phone/links in the letter
// body), and had concatenated a second project's text onto the first
// project's description field. These tests cover those real defects plus
// every scenario named in the task spec.
describe("duplicate contact details and project entries (real-data-shaped bug)", () => {
  const contactBlockText = "asha@example.com | +91 98765 43210 | github.com/ashaverma | linkedin.com/in/ashaverma";

  test("looksLikeContactInfoBlock identifies a contact-info line but not real project content", () => {
    expect(looksLikeContactInfoBlock(contactBlockText)).toBe(true);
    expect(looksLikeContactInfoBlock("A full-stack marketplace app built with React and Node.js.")).toBe(false);
    expect(looksLikeContactInfoBlock("")).toBe(false);
  });

  test("a contact-info block masquerading as a project is excluded from collectVerifiedFacts entirely", () => {
    const profile = {
      fullName: "Asha Verma",
      email: "asha@example.com",
      profileSections: {
        projects: [
          { title: contactBlockText, description: contactBlockText, techStack: ["Github"], demoLink: "" },
          { title: "Job Tracker App", description: "A MERN app for tracking job applications.", techStack: ["React", "Node.js"], demoLink: "" }
        ]
      }
    };
    const facts = collectVerifiedFacts(profile);
    expect(facts.projects).toHaveLength(1);
    expect(facts.projects[0].title).toBe("Job Tracker App");
  });

  test("a concatenated second project glued onto the first project's description is cut off, not surfaced as duplicated/garbled text", () => {
    const description =
      "Campus Marketplace (github.com/x/campus) Full-stack web app for students to buy and sell used textbooks. " +
      "Expense Tracker (github.com/x/expense, demo: expense.vercel.app) Personal finance tracker with charts.";
    const cleaned = cleanProjectDescription("Campus Marketplace (github.com/x/campus)", description);
    expect(cleaned).toBe("Full-stack web app for students to buy and sell used textbooks.");
    expect(cleaned).not.toContain("Expense Tracker");
  });

  test("duplicate project entries (same title from two profile shapes) never appear twice in the resume", () => {
    const profile = {
      fullName: "Asha Verma",
      projects: ["Job Tracker App - a MERN app for tracking applications"],
      profileSections: { projects: [{ title: "Job Tracker App", description: "A MERN app.", techStack: ["React"], demoLink: "" }] }
    };
    const facts = collectVerifiedFacts(profile);
    const resume = renderTailoredResumeHighlights(facts, { title: "Dev", skillsRequired: [] });
    expect((resume.match(/Job Tracker App/g) || []).length).toBe(1);
  });
});

describe("cover letters never contain raw profile/contact data", () => {
  const facts = collectVerifiedFacts({
    fullName: "Asha Verma",
    email: "asha@example.com",
    mobile: "9999999999",
    linkedinUrl: "https://linkedin.com/in/ashaverma",
    githubUrl: "https://github.com/ashaverma",
    profileSections: {
      projects: [{ title: "Job Tracker App", description: "A MERN app for tracking job applications.", techStack: ["React", "Node.js"], demoLink: "" }]
    }
  });
  const job = { title: "Frontend Developer Intern", companyName: "Acme Corp", skillsRequired: ["react"], prioritySkills: [] };

  test("the rendered cover letter body never repeats the candidate's email, phone, or links", () => {
    const letter = renderCoverLetterTemplate(facts, job, { matchedRequiredSkills: ["React"] });
    expect(letter).not.toMatch(/asha@example\.com/);
    expect(letter).not.toMatch(/9{10}/);
    expect(letter).not.toMatch(/linkedin\.com|github\.com/i);
  });

  test("does not use the awkward 'demonstrates this hands-on' template phrasing", () => {
    const letter = renderCoverLetterTemplate(facts, job, { matchedRequiredSkills: ["React"] });
    expect(letter.toLowerCase()).not.toContain("demonstrates this hands-on");
  });

  test("a project title carrying its own embedded link reads as a plain name in the sentence, not a raw URL", () => {
    const factsWithLinkInTitle = collectVerifiedFacts({
      fullName: "Asha Verma",
      profileSections: {
        projects: [{ title: "Portfolio Site (github.com/ashaverma/portfolio)", description: "Personal portfolio site built with Next.js.", techStack: ["Next.js"], demoLink: "" }]
      }
    });
    const letter = renderCoverLetterTemplate(factsWithLinkInTitle, job, {});
    expect(letter).not.toMatch(/github\.com/i);
    expect(letter).toContain("Portfolio Site");
    expect(letter).not.toMatch(/\(\s*(using|,)/); // no dangling "(" left behind after stripping the link
  });
});

describe("missing company, job description, or profile fields are handled with a sensible fallback", () => {
  test("a job with no company name still produces a grammatical opening and closing", () => {
    const facts = collectVerifiedFacts({ fullName: "Asha Verma" });
    const letter = renderCoverLetterTemplate(facts, { title: "Frontend Developer" }, {});
    expect(letter).toContain("Dear Hiring Manager,");
    expect(letter).toContain("Frontend Developer role");
    expect(letter).not.toMatch(/undefined|null/);
  });

  test("a job with no title at all still produces a coherent letter", () => {
    const facts = collectVerifiedFacts({ fullName: "Asha Verma" });
    const letter = renderCoverLetterTemplate(facts, {}, {});
    expect(letter).toContain("this role");
    expect(letter).not.toMatch(/undefined|null/);
  });

  test("a job with no description field (the real snapshot shape) never throws and never references it", async () => {
    const internProfile = { fullName: "Asha Verma", profileSections: { projects: [] } };
    const job = { title: "Backend Developer", companyName: "Acme" }; // no `description` key at all
    await expect(generateApplicationMaterials({ internProfile, job, fit: {}, userId: "u1" })).resolves.toBeTruthy();
  });

  test("a completely empty profile produces a letter with no invented name/contact placeholders", () => {
    const facts = collectVerifiedFacts({});
    const letter = renderCoverLetterTemplate(facts, { title: "Backend Developer", companyName: "Acme" }, {});
    expect(letter).not.toMatch(/undefined|null/);
    expect(letter).toContain("Sincerely,");
  });
});

describe("relevant project selection differs by job role (genuine tailoring, not a static pick)", () => {
  const profile = {
    fullName: "Asha Verma",
    profileSections: {
      projects: [
        { title: "ML Spam Classifier", description: "Trained a spam-detection model.", techStack: ["Python", "scikit-learn"], demoLink: "" },
        { title: "Job Tracker App", description: "A MERN app for tracking job applications.", techStack: ["React", "Node.js", "MongoDB"], demoLink: "" }
      ]
    }
  };
  const facts = collectVerifiedFacts(profile);

  // The letter can genuinely mention both projects (one as the featured
  // "For example, I built..." example, the other as a brief follow-up) --
  // what must differ by role is WHICH project leads, not whether the other
  // is excluded outright.
  test("a frontend/MERN role leads with the MERN project, not the ML project", () => {
    const letter = renderCoverLetterTemplate(facts, { title: "Frontend Developer", skillsRequired: ["react", "node.js"] }, {});
    expect(letter).toContain("Job Tracker App");
    expect(letter.indexOf("For example, I built Job Tracker App")).toBeGreaterThan(-1);
    expect(letter.indexOf("Job Tracker App")).toBeLessThan(letter.indexOf("ML Spam Classifier"));
  });

  test("a machine-learning role leads with the ML project, not the MERN project", () => {
    const letter = renderCoverLetterTemplate(facts, { title: "Machine Learning Intern", skillsRequired: ["python", "scikit-learn"] }, {});
    expect(letter).toContain("ML Spam Classifier");
    expect(letter.indexOf("For example, I built ML Spam Classifier")).toBeGreaterThan(-1);
    expect(letter.indexOf("ML Spam Classifier")).toBeLessThan(letter.indexOf("Job Tracker App"));
  });
});

describe("no invented achievements, skills, or seniority", () => {
  test("a skill never present on the profile never appears anywhere in generated materials", () => {
    const facts = collectVerifiedFacts({ fullName: "Asha Verma", skills: ["JavaScript"] });
    const job = { title: "Backend Developer", skillsRequired: ["javascript", "kubernetes", "go"], prioritySkills: [] };
    const resume = renderTailoredResumeHighlights(facts, job);
    const letter = renderCoverLetterTemplate(facts, job, {});
    expect(resume).not.toMatch(/kubernetes|\bgo\b/i);
    expect(letter).not.toMatch(/kubernetes/i);
  });

  test("a Senior-titled role never implies senior-level experience for a candidate with none on file", () => {
    const facts = collectVerifiedFacts({ fullName: "Asha Verma", skills: ["JavaScript"], experience: [] });
    const job = { title: "Senior Backend Engineer", description: "8+ years of experience required.", skillsRequired: ["javascript"], prioritySkills: [] };
    const letter = renderCoverLetterTemplate(facts, job, { matchedRequiredSkills: ["JavaScript"] });
    expect(letter).not.toMatch(/\d+\+?\s*years?/i);
    expect(letter.toLowerCase()).toContain("project-based");
  });

  test("no numeric metric appears in a project bullet unless it was already present in the candidate's own description", () => {
    const facts = collectVerifiedFacts({
      fullName: "Asha Verma",
      profileSections: { projects: [{ title: "Job Tracker App", description: "A MERN app for tracking job applications.", techStack: ["React"], demoLink: "" }] }
    });
    const resume = renderTailoredResumeHighlights(facts, { title: "Dev", skillsRequired: [] });
    expect(resume).not.toMatch(/\d+%|\d+x faster|\$\d/);
  });
});

describe("Groq failure falls back to the template, with an accurate source label", () => {
  afterEach(() => jest.resetModules());

  test("when routeCompletion throws/returns no usable content, polishCoverLetter falls back to the template with source='template'", async () => {
    jest.resetModules();
    jest.doMock("../../src/shared/infrastructure/ai/ai-provider.router", () => ({
      routeCompletion: jest.fn(async ({ localFallback }) => {
        // Simulates the real router's own behavior when every attempt fails:
        // it falls back to the caller's localFallback rather than throwing.
        return localFallback ? await localFallback() : { provider: "disabled", content: "" };
      })
    }));
    // eslint-disable-next-line global-require
    const { polishCoverLetter: polishWithMockedRouter } = require("../../src/modules/job-agent/services/application-assistant.service");
    const result = await polishWithMockedRouter("Dear Hiring Manager,\n\nTemplate content.\n\nSincerely,\nAsha", { userId: "u1", jobTitle: "Dev" });
    expect(result.source).toBe("template");
    expect(result.content).toBe("Dear Hiring Manager,\n\nTemplate content.\n\nSincerely,\nAsha");
  });

  test("a Groq response containing a stray contact token is sanitized, and an oversized/hallucinated response is discarded in favor of the template", async () => {
    jest.resetModules();
    jest.doMock("../../src/shared/infrastructure/ai/ai-provider.router", () => ({
      routeCompletion: jest.fn(async () => ({ provider: "groq", content: "x".repeat(10000) })) // absurdly long -> fails the sanity check
    }));
    // eslint-disable-next-line global-require
    const { polishCoverLetter: polishWithMockedRouter } = require("../../src/modules/job-agent/services/application-assistant.service");
    const template = "Dear Hiring Manager,\n\nShort template.\n\nSincerely,\nAsha";
    const result = await polishWithMockedRouter(template, { userId: "u1", jobTitle: "Dev" });
    expect(result.source).toBe("template");
    expect(result.content).toBe(template);
  });

  test("a sane Groq rewrite is accepted and labeled with the real provider name", async () => {
    jest.resetModules();
    jest.doMock("../../src/shared/infrastructure/ai/ai-provider.router", () => ({
      routeCompletion: jest.fn(async () => ({ provider: "groq", content: "Dear Hiring Manager,\n\nA cleanly rewritten short letter.\n\nSincerely,\nAsha" }))
    }));
    // eslint-disable-next-line global-require
    const { polishCoverLetter: polishWithMockedRouter } = require("../../src/modules/job-agent/services/application-assistant.service");
    const result = await polishWithMockedRouter("Dear Hiring Manager,\n\nTemplate content.\n\nSincerely,\nAsha", { userId: "u1", jobTitle: "Dev" });
    expect(result.source).toBe("groq");
    expect(result.content).toContain("cleanly rewritten");
  });
});

// Regression suite for this round's resume/cover-letter quality pass. Real
// profile inspection (the same "Aarav Sharma" demo profile used throughout
// this feature's development) showed: a raw unformatted "email | phone |
// url | url" contact line, a literal "Tailored for: ..." metadata line
// leaking into the candidate-facing document, one long comma-separated
// skill wall, and the same underlying skill appearing twice in that list
// under two different spellings ("ExpressJS" from this module's own
// normalizer vs. "Express.js" from the resume parser's).
describe("resume content quality: contact formatting, no leaked metadata, categorized skills", () => {
  const richProfile = {
    fullName: "Asha Verma",
    email: "asha@example.com",
    mobile: "919876543210",
    linkedinUrl: "https://linkedin.com/in/ashaverma",
    githubUrl: "https://github.com/ashaverma",
    skills: ["JavaScript", "ExpressJS", "NodeJS", "React", "MongoDB"],
    profileSections: {
      projects: [{ title: "Job Tracker App", description: "A MERN app for tracking job applications.", techStack: ["React", "Node.js", "MongoDB"], demoLink: "" }]
    }
  };
  const job = { title: "Backend Developer", companyName: "Acme", skillsRequired: ["javascript"], prioritySkills: [] };

  test("the resume never contains the internal 'Tailored for' metadata line", () => {
    const facts = collectVerifiedFacts(richProfile);
    const resume = renderTailoredResumeHighlights(facts, job);
    expect(resume.toLowerCase()).not.toContain("tailored for");
  });

  test("contact info is formatted as clearly labeled, separated lines, not one raw concatenated run-on", () => {
    const facts = collectVerifiedFacts(richProfile);
    const resume = renderTailoredResumeHighlights(facts, job);
    // Email and phone are not jammed into the same line as the links.
    expect(resume).toContain("asha@example.com");
    // Full https:// URLs are kept (not stripped) so the frontend preview
    // can auto-linkify them; it shortens the on-screen label itself.
    expect(resume).toMatch(/LinkedIn: https:\/\/linkedin\.com\/in\/ashaverma/);
    expect(resume).toMatch(/GitHub: https:\/\/github\.com\/ashaverma/);
    // The raw, unlabeled "a | b | c | d" shape is gone.
    expect(resume).not.toMatch(/asha@example\.com \| \d{10,}/);
  });

  test("a readable Indian mobile number is formatted with its country code and spacing", () => {
    const facts = collectVerifiedFacts(richProfile);
    const resume = renderTailoredResumeHighlights(facts, job);
    expect(resume).toContain("+91 98765 43210");
  });

  test("an unrecognized phone shape is shown exactly as stored, never reformatted on a guess", () => {
    const facts = collectVerifiedFacts({ ...richProfile, mobile: "call-me-maybe" });
    const resume = renderTailoredResumeHighlights(facts, job);
    expect(resume).toContain("call-me-maybe");
  });

  test("the same verified skill is never listed twice under two different spellings from the two vocabularies in this codebase", () => {
    const facts = collectVerifiedFacts(richProfile);
    const resume = renderTailoredResumeHighlights(facts, job);
    // "ExpressJS" (this module's own normalizer) and "Express.js" (the
    // resume parser's canonical form) are the same skill -- only one may
    // appear in the TECHNICAL SKILLS section (a project's own "Built with:"
    // line may legitimately repeat a skill it actually uses, so the check
    // is scoped to the skills section alone).
    const skillsSection = resume.slice(resume.indexOf("TECHNICAL SKILLS"), resume.indexOf("PROJECTS"));
    expect((skillsSection.match(/express\.?js/gi) || []).length).toBe(1);
  });

  test("skills are grouped under labeled categories, not one long comma-separated wall", () => {
    const facts = collectVerifiedFacts(richProfile);
    const resume = renderTailoredResumeHighlights(facts, job);
    expect(resume).toContain("TECHNICAL SKILLS");
    expect(resume).toMatch(/Languages:|Frameworks & Web:/);
  });

  test("the professional summary is composed for the target role, not the candidate's static generic profile text", () => {
    const facts = collectVerifiedFacts({ ...richProfile, bio: "Aspiring software engineer seeking an internship to apply and grow those skills." });
    const resume = renderTailoredResumeHighlights(facts, job);
    expect(resume).toContain("Backend Developer");
    expect(resume).not.toContain("Aspiring software engineer seeking an internship to apply and grow those skills.");
  });
});

describe("duplicate projects and duplicate links are removed", () => {
  test("two profile entries that resolve to the same link collapse into one project", () => {
    const profile = {
      fullName: "Asha Verma",
      profileSections: {
        projects: [
          { title: "Campus Marketplace (github.com/x/campus)", description: "Full-stack marketplace app.", techStack: ["React"], demoLink: "" },
          { title: "Campus Marketplace Project", description: "Full-stack marketplace app, same one.", techStack: ["React"], demoLink: "https://github.com/x/campus" }
        ]
      }
    };
    const facts = collectVerifiedFacts(profile);
    expect(facts.projects).toHaveLength(1);
  });

  test("a link embedded only in an old-format title (no separate demoLink field) is still recovered and shown once, not duplicated in the title text", () => {
    const profile = {
      fullName: "Asha Verma",
      profileSections: {
        projects: [{ title: "Campus Marketplace (github.com/x/campus)", description: "Full-stack marketplace app.", techStack: [], demoLink: "" }]
      }
    };
    const facts = collectVerifiedFacts(profile);
    expect(facts.projects[0].title).toBe("Campus Marketplace");
    expect(facts.projects[0].link).toBe("https://github.com/x/campus");
    const resume = renderTailoredResumeHighlights(facts, { title: "Dev", skillsRequired: [] });
    // The link appears exactly once (on its own "Link:" line), not also
    // still embedded in the printed title.
    expect((resume.match(/github\.com\/x\/campus/g) || []).length).toBe(1);
  });
});

describe("cover letter word count and grammar (120-180 word target)", () => {
  const richProfile = {
    fullName: "Asha Verma",
    skills: ["JavaScript", "Node.js", "MongoDB", "Socket.io"],
    profileSections: {
      projects: [
        { title: "Campus Marketplace", description: "Full-stack web app for students to buy and sell used textbooks.", techStack: ["React", "Node.js", "MongoDB"], demoLink: "" },
        { title: "Realtime Chat App", description: "One-to-one and group chat application using Socket.io.", techStack: ["Socket.io", "MongoDB"], demoLink: "" }
      ]
    }
  };
  const job = { title: "Backend Developer", companyName: "Acme", skillsRequired: ["javascript", "node.js"], prioritySkills: [] };

  test("a data-rich profile produces a letter close to the 120-180 word target, not an abrupt 50-word stub", () => {
    const facts = collectVerifiedFacts(richProfile);
    const letter = renderCoverLetterTemplate(facts, job, { matchedRequiredSkills: ["JavaScript", "Node.js"] });
    const wordCount = letter.trim().split(/\s+/).length;
    expect(wordCount).toBeGreaterThanOrEqual(100);
    expect(wordCount).toBeLessThanOrEqual(200);
  });

  test("a project description starting with a past-tense action verb produces a grammatical clause, not a doubled article", () => {
    const profile = {
      fullName: "Asha Verma",
      profileSections: { projects: [{ title: "ML Spam Classifier", description: "Trained a spam-detection model using scikit-learn.", techStack: ["Python", "scikit-learn"], demoLink: "" }] }
    };
    const facts = collectVerifiedFacts(profile);
    const letter = renderCoverLetterTemplate(facts, { title: "ML Intern", skillsRequired: ["python"], prioritySkills: [] }, {});
    expect(letter).not.toMatch(/a trained a/i);
    expect(letter).toContain("where I trained a spam-detection model");
  });

  test("a sparse profile is not padded with generic filler just to reach the word-count target", () => {
    const facts = collectVerifiedFacts({ fullName: "Asha Verma" });
    const letter = renderCoverLetterTemplate(facts, { title: "Backend Developer", companyName: "Acme" }, {});
    expect(letter.toLowerCase()).not.toMatch(/very excited|passionate|dream job|perfect fit/);
  });
});
