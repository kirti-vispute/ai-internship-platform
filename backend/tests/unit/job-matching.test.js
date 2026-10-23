const { buildJobFitScore, classifyExperienceLevel, classifyRoleRelevance } = require("../../src/modules/job-agent/services/job-matching.service");

describe("buildJobFitScore", () => {
  const internProfile = {
    skills: ["JavaScript", "React", "MongoDB"],
    education: [{ college: "ABC", degree: "B.Tech" }],
    experience: []
  };

  test("full required-skill match with no preferences scores high and lists no missing skills", () => {
    const job = { title: "Frontend Developer", description: "", workMode: "remote", location: "", skillsRequired: ["javascript", "react"], prioritySkills: [] };
    const result = buildJobFitScore({ internProfile, preference: null, job });
    expect(result.missingRequiredSkills).toEqual([]);
    expect(result.fitScore).toBeGreaterThanOrEqual(90);
  });

  test("missing required skills are listed separately from preferred skills and lower the score", () => {
    const job = { title: "Backend Developer", description: "", workMode: "remote", location: "", skillsRequired: ["javascript", "docker", "aws"], prioritySkills: [] };
    const result = buildJobFitScore({ internProfile, preference: null, job });
    expect(result.matchedRequiredSkills).toEqual(expect.arrayContaining(["JavaScript"]));
    expect(result.missingRequiredSkills).toEqual(expect.arrayContaining(["Docker", "AWS"]));
    expect(result.fitScore).toBeLessThan(100);
  });

  test("a job with zero required skills never scores a candidate 0 (vacuous match)", () => {
    const job = { title: "Open Role", description: "", workMode: "", location: "", skillsRequired: [], prioritySkills: [] };
    const result = buildJobFitScore({ internProfile, preference: null, job });
    expect(result.fitScore).toBeGreaterThan(0);
  });

  test("missing salary/location data on the listing is flagged, never silently penalized to a hard fail", () => {
    const preference = { desiredRoles: [], locations: ["Pune"], workMode: "any", minSalary: 20000, salaryCurrency: "INR" };
    const job = { title: "Developer", description: "", workMode: "", location: "", salaryMin: null, salaryMax: null, skillsRequired: ["javascript"], prioritySkills: [] };
    const result = buildJobFitScore({ internProfile, preference, job });
    expect(result.eligibilityConcerns.some((c) => c.toLowerCase().includes("doesn't state a location"))).toBe(true);
    expect(result.eligibilityConcerns.some((c) => c.toLowerCase().includes("doesn't state a salary"))).toBe(true);
    // Unknown data is treated as neutral (0.5), not a hard 0 -- preferenceScore must stay above a hard-fail floor.
    expect(result.breakdown.preferenceScore).toBeGreaterThan(0);
  });

  test("a work-mode mismatch against saved preferences is surfaced as a concern", () => {
    const preference = { desiredRoles: [], locations: [], workMode: "remote", minSalary: null };
    const job = { title: "Developer", description: "", workMode: "on-site", location: "", skillsRequired: ["javascript"], prioritySkills: [] };
    const result = buildJobFitScore({ internProfile, preference, job });
    expect(result.preferenceMatch.workMode).toBe(false);
    expect(result.eligibilityConcerns.some((c) => c.includes("on-site"))).toBe(true);
  });

  test("a listing worded for senior candidates with no experience on the profile lowers the experience dimension and is flagged", () => {
    const job = {
      title: "Senior Backend Engineer",
      description: "5+ years experience required.",
      workMode: "remote",
      location: "",
      skillsRequired: ["javascript"],
      prioritySkills: []
    };
    const result = buildJobFitScore({ internProfile, preference: null, job });
    expect(result.breakdown.experienceScore).toBeLessThan(100);
    expect(result.eligibilityConcerns.some((c) => c.toLowerCase().includes("experienced candidates"))).toBe(true);
  });

  test("external listings get an explicit approximate-skills disclaimer in the explanation; internal ones do not", () => {
    const job = { title: "Developer", description: "", workMode: "remote", location: "", skillsRequired: ["javascript"], prioritySkills: [] };
    const external = buildJobFitScore({ internProfile, preference: null, job, isExternal: true });
    const internal = buildJobFitScore({ internProfile, preference: null, job, isExternal: false });
    expect(external.explanation).toMatch(/approximate/i);
    expect(internal.explanation).not.toMatch(/approximate/i);
  });

  test("an empty education array on the profile is flagged as an eligibility concern rather than silently assumed", () => {
    const profileWithoutEducation = { skills: ["JavaScript"], education: [], experience: [] };
    const job = { title: "Developer", description: "", workMode: "remote", location: "", skillsRequired: ["javascript"], prioritySkills: [] };
    const result = buildJobFitScore({ internProfile: profileWithoutEducation, preference: null, job });
    expect(result.eligibilityConcerns.some((c) => c.toLowerCase().includes("education"))).toBe(true);
  });

  test("buildJobFitScore exposes the job's classified experienceLevelTag", () => {
    const job = { title: "Software Engineering Intern", description: "", workMode: "remote", location: "", skillsRequired: [], prioritySkills: [] };
    const result = buildJobFitScore({ internProfile, preference: null, job });
    expect(result.experienceLevelTag).toBe("internship");
  });

  test("flags a graduation-year concern when an internship listing's candidate already graduated, without excluding the listing", () => {
    const profileGraduatedLastYear = {
      skills: ["JavaScript"],
      education: [],
      experience: [],
      educationDetails: [{ degree: "B.Tech", passingYear: "2024" }]
    };
    const job = { title: "Software Engineering Intern", description: "", workMode: "remote", location: "", skillsRequired: [], prioritySkills: [] };
    const result = buildJobFitScore({ internProfile: profileGraduatedLastYear, preference: null, job });
    expect(result.eligibilityConcerns.some((c) => c.includes("2024"))).toBe(true);
    expect(result.fitScore).toBeGreaterThan(0); // a concern, not a disqualification
  });

  test("does not raise a graduation-year concern for a candidate who has not graduated yet, or for a non-internship listing", () => {
    const profileStillStudying = {
      skills: ["JavaScript"],
      education: [],
      experience: [],
      educationDetails: [{ degree: "B.Tech", passingYear: "2030" }]
    };
    const internshipJob = { title: "Software Engineering Intern", description: "", workMode: "remote", location: "", skillsRequired: [], prioritySkills: [] };
    const fullTimeJob = { title: "Software Engineer", description: "", workMode: "remote", location: "", skillsRequired: [], prioritySkills: [] };

    const stillStudyingResult = buildJobFitScore({ internProfile: profileStillStudying, preference: null, job: internshipJob });
    expect(stillStudyingResult.eligibilityConcerns.some((c) => c.toLowerCase().includes("graduation"))).toBe(false);

    const graduatedProfile = { skills: ["JavaScript"], education: [], experience: [], educationDetails: [{ degree: "B.Tech", passingYear: "2020" }] };
    const fullTimeResult = buildJobFitScore({ internProfile: graduatedProfile, preference: null, job: fullTimeJob });
    expect(fullTimeResult.eligibilityConcerns.some((c) => c.toLowerCase().includes("graduation"))).toBe(false);
  });
});

describe("classifyExperienceLevel", () => {
  test("classifies internship postings via title keywords", () => {
    expect(classifyExperienceLevel({ title: "Frontend Intern", description: "" })).toBe("internship");
  });

  test("prefers a provider-stated internship jobType over keyword guessing", () => {
    expect(classifyExperienceLevel({ title: "Software Engineer I", description: "", jobType: "internship" })).toBe("internship");
  });

  test("classifies senior-sounding postings as mid_senior", () => {
    expect(classifyExperienceLevel({ title: "Senior Backend Engineer", description: "5+ years required" })).toBe("mid_senior");
  });

  test("classifies explicit fresher/entry-level keywords", () => {
    expect(classifyExperienceLevel({ title: "Graduate Software Engineer", description: "" })).toBe("fresher_entry");
  });

  test("falls back to unspecified rather than guessing when no signal exists", () => {
    expect(classifyExperienceLevel({ title: "Software Engineer", description: "" })).toBe("unspecified");
  });
});

// Regression suite for the reported bug: "Opticien (contrat freelance) FR"
// scored an 80% fit against a saved "Full Stack Developer" preference. Root
// cause was the shared compute-skill-match.js vacuous-truth rule (a job
// with zero listed required skills is scored 100% on skills, by design, for
// genuine internal listings) combined with role mismatch being only a
// small, non-exclusionary slice of the old "preferences" dimension.
describe("classifyRoleRelevance", () => {
  test("a clear role match (exact synonym-group hit) is tagged relevant", () => {
    expect(classifyRoleRelevance(["Full Stack Developer"], { title: "Full Stack Developer", description: "" }).tag).toBe("relevant");
  });

  test("an adjacent software role is tagged adjacent, not relevant or unrelated", () => {
    const result = classifyRoleRelevance(["Full Stack Developer"], { title: "Backend Developer", description: "" });
    expect(result.tag).toBe("adjacent");
    expect(result.score).toBeLessThan(100);
    expect(result.score).toBeGreaterThan(30);
  });

  test("the reported bug: optician job vs Full Stack Developer preference is tagged unrelated with a low score", () => {
    const result = classifyRoleRelevance(["Full Stack Developer"], {
      title: "Opticien (contrat freelance) FR",
      description: "Ce opticien diplome, a l'aise avec le conseil a distance, rejoindra l'equipe d'opticiens."
    });
    expect(result.tag).toBe("unrelated");
    expect(result.score).toBeLessThanOrEqual(10);
  });

  test("freelance writer vs Full Stack Developer preference is tagged unrelated", () => {
    const result = classifyRoleRelevance(["Full Stack Developer"], { title: "Freelance Writer - Tech Blog", description: "" });
    expect(result.tag).toBe("unrelated");
  });

  test("sales contractor vs Full Stack Developer preference is tagged unrelated", () => {
    const result = classifyRoleRelevance(["Full Stack Developer"], { title: "Sales Contractor - Paris Region", description: "" });
    expect(result.tag).toBe("unrelated");
  });

  test("a non-software 'engineer' title (sales engineer) is tagged unrelated, not relevant, despite containing the word engineer", () => {
    const result = classifyRoleRelevance(["Software Engineer"], { title: "Sales Engineer", description: "" });
    expect(result.tag).toBe("unrelated");
  });

  // Real listing found via acceptance testing (Arbeitnow, German market): a
  // German sales-rep role whose title happens to contain "Software" as the
  // product being sold ("...Vertrieb landwirtschaftliche Software" --
  // "...sales of agricultural software") was scoring 91% because the
  // profession blacklist only covered English role nouns, so the generic
  // SOFTWARE_DOMAIN_SIGNAL hit went unchallenged.
  test("a German sales-rep title mentioning 'Software' as the product sold is tagged unrelated, not treated as a software role", () => {
    const result = classifyRoleRelevance(["Full Stack Developer"], {
      title: "selbststandiger Handelsvertreter (m/w/d) Vertrieb landwirtschaftliche Software",
      description: ""
    });
    expect(result.tag).toBe("unrelated");
    expect(result.score).toBeLessThanOrEqual(30);
  });

  test("relevant junior/internship software roles stay relevant or adjacent, never unrelated", () => {
    expect(classifyRoleRelevance(["Full Stack Developer"], { title: "Junior Full Stack Developer Intern", description: "" }).tag).toBe("relevant");
    expect(["relevant", "adjacent"]).toContain(
      classifyRoleRelevance(["Full Stack Developer"], { title: "Software Engineering Intern", description: "" }).tag
    );
  });

  test("no saved desired roles -> neutral, not a verdict", () => {
    expect(classifyRoleRelevance([], { title: "Opticien", description: "" })).toEqual({ tag: "no_preference", score: 100, reason: "" });
  });

  test("desired roles outside the built software taxonomy -> not_applicable, never a fabricated unrelated verdict", () => {
    const result = classifyRoleRelevance(["Marketing Intern"], { title: "Opticien", description: "" });
    expect(result.tag).toBe("not_applicable");
    expect(result.score).toBe(100);
  });

  // Regression: a real-data sweep found "Head of Operations" (a plainly
  // non-software role) tagged "adjacent" at 88% fit because its long
  // description mentions "software" exactly once, incidentally ("...the
  // software, and our clients"). A single generic tech word anywhere in a
  // long description must never promote an otherwise-ambiguous title to
  // software-adjacent.
  test("a non-software title whose long description mentions a generic tech word only in passing stays unknown, not adjacent", () => {
    const result = classifyRoleRelevance(["Full Stack Developer"], {
      title: "Head of Operations",
      description: "Leverage Live Local prepares property tax exemptions. One shared source of truth for the team, the software, and our clients."
    });
    expect(result.tag).toBe("unknown");
  });

  test("an ambiguous title with no signal either way is tagged unknown, not unrelated or relevant", () => {
    const result = classifyRoleRelevance(["Full Stack Developer"], { title: "Associate II", description: "General responsibilities as assigned." });
    expect(result.tag).toBe("unknown");
  });

  // Regression: a real-data sweep against the live external-listing cache
  // found plainly non-software business-generalist titles (not covered by
  // the curated non-software-profession keyword list, including
  // German-language titles) scoring 82-88% while merely tagged "unknown" --
  // the same underlying bug as the reported one, just not caught by the
  // curated blocklist. These must score low, not neutral/high, even when
  // this classifier has no positive match for the specific title.
  test.each([
    "Key Account Manager Frankfurt (f/m/d) - Public Sector",
    "CRM Manager - Lifecycle & Engagement (f/m/d)",
    "Legal Counsel, Litigation and Copyright",
    "Financial Solutions Advisor - Little Rock Area",
    "Senior Category Manager - FMCG (all genders)"
  ])("unrecognized non-software title '%s' is tagged unknown with a low score, not a neutral/high one", (title) => {
    const result = classifyRoleRelevance(["Full Stack Developer"], { title, description: "" });
    expect(result.tag).toBe("unknown");
    expect(result.score).toBeLessThanOrEqual(45);
  });

  // "Verkäuferin" (German for "saleswoman") is now a recognized profession
  // term (see NON_SOFTWARE_PROFESSION_SIGNAL), so it gets the more precise
  // "unrelated"/score-5 verdict instead of falling back to "unknown" --
  // strictly tighter than the "unknown, <=45" this title used to get.
  test("a recognized German non-software title ('Verkäuferin') is tagged unrelated, not merely unknown", () => {
    const result = classifyRoleRelevance(["Full Stack Developer"], { title: "Verkäuferin (m/w/d) - Werkstudent", description: "" });
    expect(result.tag).toBe("unrelated");
    expect(result.score).toBeLessThanOrEqual(10);
  });
});

describe("buildJobFitScore role-relevance integration (score calibration)", () => {
  const strongInternProfile = {
    skills: ["JavaScript", "React", "Node.js", "MongoDB"],
    education: [{ college: "ABC", degree: "B.Tech" }],
    experience: []
  };
  const fullStackPreference = { desiredRoles: ["Full Stack Developer"] };

  test("the reported bug is fixed: the real optician listing no longer scores a high/misleading fit", () => {
    const opticianJob = {
      title: "Opticien (contrat freelance) FR",
      description: "Opticien diplome recherche pour conseil a distance aupres de nos membres.",
      workMode: "",
      location: "Paris, France",
      skillsRequired: [],
      prioritySkills: []
    };
    const result = buildJobFitScore({ internProfile: strongInternProfile, preference: fullStackPreference, job: opticianJob, isExternal: true });
    expect(result.fitScore).toBeLessThanOrEqual(30);
    expect(result.roleRelevance.tag).toBe("unrelated");
    expect(result.explanation.toLowerCase()).toContain("outside software/tech");
  });

  test("a business-generalist listing this classifier doesn't positively recognize still scores low end-to-end, not 80%+ (found via a real-data sweep)", () => {
    const job = {
      title: "Key Account Manager Frankfurt (f/m/d) - Public Sector",
      description: "",
      workMode: "",
      location: "Frankfurt, Germany",
      skillsRequired: [],
      prioritySkills: []
    };
    const result = buildJobFitScore({ internProfile: strongInternProfile, preference: fullStackPreference, job, isExternal: true });
    expect(result.roleRelevance.tag).toBe("unknown");
    expect(result.fitScore).toBeLessThanOrEqual(45);
  });

  test("freelance writer and sales contractor listings also score low against a Full Stack Developer preference", () => {
    const writerJob = { title: "Freelance Technical Writer", description: "", workMode: "remote", location: "", skillsRequired: [], prioritySkills: [] };
    const salesJob = { title: "Sales Contractor", description: "", workMode: "", location: "Berlin", skillsRequired: [], prioritySkills: [] };
    expect(buildJobFitScore({ internProfile: strongInternProfile, preference: fullStackPreference, job: writerJob }).fitScore).toBeLessThanOrEqual(30);
    expect(buildJobFitScore({ internProfile: strongInternProfile, preference: fullStackPreference, job: salesJob }).fitScore).toBeLessThanOrEqual(30);
  });

  test("relevant junior/internship software roles still score well (not collateral damage from the fix)", () => {
    const job = {
      title: "Junior Full Stack Developer",
      description: "Entry-level role building features end to end.",
      workMode: "remote",
      location: "",
      skillsRequired: ["javascript", "react"],
      prioritySkills: []
    };
    const result = buildJobFitScore({ internProfile: strongInternProfile, preference: fullStackPreference, job });
    expect(result.fitScore).toBeGreaterThanOrEqual(80);
    expect(result.roleRelevance.tag).toBe("relevant");
  });

  test("existing valid high-match jobs remain highly ranked (no regression for the common case)", () => {
    const job = {
      title: "Full Stack Developer",
      description: "Build and ship features across the stack.",
      workMode: "remote",
      location: "",
      skillsRequired: ["javascript", "react", "mongodb"],
      prioritySkills: []
    };
    const result = buildJobFitScore({ internProfile: strongInternProfile, preference: fullStackPreference, job });
    expect(result.fitScore).toBeGreaterThanOrEqual(90);
  });

  test("missing job description/skills alone (role still relevant) does not get penalized as if it were a role mismatch", () => {
    const job = { title: "Full Stack Developer", description: "", workMode: "", location: "", skillsRequired: [], prioritySkills: [] };
    const result = buildJobFitScore({ internProfile: strongInternProfile, preference: fullStackPreference, job });
    expect(result.roleRelevance.tag).toBe("relevant");
    expect(result.fitScore).toBeGreaterThanOrEqual(70);
  });

  test("unknown experience/graduation eligibility is labeled unknown via a concern, never silently assumed eligible or scored down", () => {
    const profileNoEducationNoExperience = { skills: ["JavaScript"], education: [], experience: [] };
    const seniorJob = { title: "Full Stack Developer", description: "5+ years experience required.", workMode: "", location: "", skillsRequired: ["javascript"], prioritySkills: [] };
    const result = buildJobFitScore({ internProfile: profileNoEducationNoExperience, preference: fullStackPreference, job: seniorJob });
    expect(result.eligibilityConcerns.some((c) => c.toLowerCase().includes("experience"))).toBe(true);
    expect(result.eligibilityConcerns.some((c) => c.toLowerCase().includes("education"))).toBe(true);
    // A concern, not an exclusion or an auto-assumed pass/fail.
    expect(result.fitScore).toBeGreaterThan(0);
  });

  test("remote jobs are not penalized for location, but a location-restricted job conflicting with saved locations is flagged (soft, not excluded)", () => {
    const preferenceWithLocation = { desiredRoles: ["Full Stack Developer"], locations: ["Bangalore"], workMode: "any" };
    const remoteJob = { title: "Full Stack Developer", description: "", workMode: "remote", location: "", skillsRequired: ["javascript"], prioritySkills: [] };
    const parisOnsiteJob = { title: "Full Stack Developer", description: "", workMode: "on-site", location: "Paris, France", skillsRequired: ["javascript"], prioritySkills: [] };

    const remoteResult = buildJobFitScore({ internProfile: strongInternProfile, preference: preferenceWithLocation, job: remoteJob });
    expect(remoteResult.eligibilityConcerns.some((c) => c.toLowerCase().includes("location"))).toBe(false);

    const onsiteResult = buildJobFitScore({ internProfile: strongInternProfile, preference: preferenceWithLocation, job: parisOnsiteJob });
    expect(onsiteResult.eligibilityConcerns.some((c) => c.toLowerCase().includes("location"))).toBe(true);
    // Soft mismatch -- still returned/scored, never excluded outright by the matching engine itself.
    expect(onsiteResult.fitScore).toBeGreaterThan(0);
  });

  test("a listing with an explicit non-English language requirement is flagged as unknown, not scored against the candidate", () => {
    const job = { title: "Full Stack Developer", description: "Must speak French fluently to support our Paris office.", workMode: "on-site", location: "Paris", skillsRequired: ["javascript"], prioritySkills: [] };
    const result = buildJobFitScore({ internProfile: strongInternProfile, preference: fullStackPreference, job });
    expect(result.eligibilityConcerns.some((c) => c.includes("French") && c.toLowerCase().includes("unknown"))).toBe(true);
  });
});
