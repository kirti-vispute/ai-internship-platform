const { toInternalJobShape, toExternalJobShape, dedupeAcrossSources, canonicalizeUrl, matchesFilters } = require("../../src/modules/job-agent/services/job-feed.service");

describe("job feed normalization and dedup", () => {
  test("toInternalJobShape maps an Internship doc into the unified job shape without losing eligibility text", () => {
    const internship = {
      _id: "64a0000000000000000000a1",
      role: "Backend Intern",
      company: { companyName: "Acme" },
      location: "Remote",
      mode: "remote",
      skillsRequired: ["nodejs"],
      prioritySkills: [],
      eligibilityCriteria: "Final year students only",
      description: "Build APIs."
    };
    const job = toInternalJobShape(internship);
    expect(job.isInternal).toBe(true);
    expect(job.title).toBe("Backend Intern");
    expect(job.companyName).toBe("Acme");
    expect(job.rawEligibilityText).toContain("Final year students only");
  });

  test("toExternalJobShape maps an ExternalJobListing doc, treating extractedSkills as skillsRequired", () => {
    const listing = {
      _id: "64a0000000000000000000a2",
      source: "remotive",
      sourceId: "123",
      title: "Frontend Dev",
      companyName: "RemoteCo",
      location: "",
      workMode: "remote",
      extractedSkills: ["react"],
      applyUrl: "https://remotive.com/jobs/123"
    };
    const job = toExternalJobShape(listing);
    expect(job.isInternal).toBe(false);
    expect(job.skillsRequired).toEqual(["react"]);
    expect(job.applyUrl).toBe("https://remotive.com/jobs/123");
  });

  test("dedupeAcrossSources drops repeat external listings with the same title+company+location but never drops internal postings", () => {
    const jobs = [
      { isInternal: false, title: "Frontend Dev", companyName: "RemoteCo", applyUrl: "https://a.example/1" },
      { isInternal: false, title: "Frontend Dev", companyName: "RemoteCo", applyUrl: "https://a.example/2" }, // duplicate, e.g. posted on two external boards
      { isInternal: true, title: "Frontend Dev", companyName: "RemoteCo" } // same title/company but internal -- always kept
    ];
    const result = dedupeAcrossSources(jobs);
    expect(result).toHaveLength(2);
    expect(result.filter((j) => j.isInternal)).toHaveLength(1);
  });

  test("dedupeAcrossSources also drops a repeat by canonical apply URL alone, even with a different title/company casing", () => {
    const jobs = [
      { isInternal: false, title: "Backend Engineer", companyName: "Acme Inc", applyUrl: "https://boards.greenhouse.io/acme/jobs/123?utm_source=x" },
      { isInternal: false, title: "backend engineer ", companyName: "Acme Inc.", applyUrl: "https://boards.greenhouse.io/acme/jobs/123/" } // same posting, re-indexed by an aggregator with tracking params + trailing slash
    ];
    const result = dedupeAcrossSources(jobs);
    expect(result).toHaveLength(1);
  });

  test("canonicalizeUrl strips scheme, query string, and trailing slash", () => {
    expect(canonicalizeUrl("https://example.com/jobs/1?utm=x")).toBe(canonicalizeUrl("http://example.com/jobs/1/"));
  });
});

describe("matchesFilters", () => {
  const remotiveJob = { isInternal: false, source: "remotive", title: "Frontend Dev", companyName: "RemoteCo", location: "Remote", workMode: "remote", skillsRequired: ["react"], salaryMin: 400000, salaryMax: 600000, description: "" };
  const adzunaJob = { isInternal: false, source: "adzuna", title: "Backend Dev", companyName: "OtherCo", location: "Bangalore", workMode: "on-site", skillsRequired: ["nodejs"], salaryMin: 800000, salaryMax: 1200000, description: "" };
  const internalJob = { isInternal: true, source: "internal", title: "Data Intern", companyName: "CareerSetu Co", location: "Pune", workMode: "hybrid", skillsRequired: ["python"], salaryMin: null, salaryMax: null, description: "Internship for final year students." };
  const seniorJob = { isInternal: false, source: "remotive", title: "Senior Backend Engineer", companyName: "BigCo", location: "Remote", workMode: "remote", skillsRequired: ["nodejs"], salaryMin: null, salaryMax: null, description: "5+ years of experience required." };

  // Regression test for Bug #2: filtering by a specific external provider must
  // exclude jobs from OTHER external providers, not just internal ones.
  test("source=remotive excludes adzuna jobs but keeps remotive jobs", () => {
    expect(matchesFilters(remotiveJob, { source: "remotive" })).toBe(true);
    expect(matchesFilters(adzunaJob, { source: "remotive" })).toBe(false);
  });

  test("source=internal only matches internal jobs, excluding both external providers", () => {
    expect(matchesFilters(internalJob, { source: "internal" })).toBe(true);
    expect(matchesFilters(remotiveJob, { source: "internal" })).toBe(false);
    expect(matchesFilters(adzunaJob, { source: "internal" })).toBe(false);
  });

  test("source=all or omitted does not filter by source", () => {
    expect(matchesFilters(remotiveJob, { source: "all" })).toBe(true);
    expect(matchesFilters(adzunaJob, {})).toBe(true);
  });

  test("role filter matches case-insensitively against the job title", () => {
    expect(matchesFilters(remotiveJob, { role: "frontend" })).toBe(true);
    expect(matchesFilters(remotiveJob, { role: "FRONTEND" })).toBe(true);
    expect(matchesFilters(remotiveJob, { role: "backend" })).toBe(false);
  });

  test("minSalary excludes jobs whose stated salary is below the threshold but never excludes jobs with no salary info", () => {
    expect(matchesFilters(remotiveJob, { minSalary: 500000 })).toBe(true); // salaryMax 600000 >= 500000
    expect(matchesFilters(remotiveJob, { minSalary: 700000 })).toBe(false); // salaryMax 600000 < 700000
    expect(matchesFilters(internalJob, { minSalary: 500000 })).toBe(true); // no salary info -- missing data must not prove ineligibility
  });

  test("entryLevelOnly excludes listings that look senior and keeps internships/entry-level listings", () => {
    expect(matchesFilters(seniorJob, { entryLevelOnly: true })).toBe(false);
    expect(matchesFilters(internalJob, { entryLevelOnly: true })).toBe(true);
    expect(matchesFilters(remotiveJob, { entryLevelOnly: true })).toBe(true);
  });

  test("filters compose together (role + source + minSalary all must pass)", () => {
    expect(matchesFilters(adzunaJob, { role: "backend", source: "adzuna", minSalary: 700000 })).toBe(true);
    expect(matchesFilters(adzunaJob, { role: "backend", source: "remotive", minSalary: 700000 })).toBe(false);
  });

  test("category filter matches the job's classified experience-level tag", () => {
    const internshipJob = { isInternal: false, source: "remotive", title: "Software Engineering Intern", companyName: "Acme", location: "", workMode: "remote", skillsRequired: [], salaryMin: null, salaryMax: null, description: "" };
    expect(matchesFilters(internshipJob, { category: "internship" })).toBe(true);
    expect(matchesFilters(internshipJob, { category: "mid_senior" })).toBe(false);
    expect(matchesFilters(seniorJob, { category: "mid_senior" })).toBe(true);
    expect(matchesFilters(seniorJob, { category: "all" })).toBe(true);
  });
});
