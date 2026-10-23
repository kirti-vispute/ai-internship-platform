// Integration tests for the multi-source discovery pipeline against the
// real (in-memory) MongoDB: provider failure isolation, per-provider health
// persistence, and stale/removed-listing deactivation. Every provider's own
// fetchJobs() is mocked here -- this suite is about the PIPELINE (upsert,
// health, dedup-by-staleness), not about any individual provider's HTTP
// parsing (that's job-agent-providers.test.js, a unit test).
const request = require("supertest");
const app = require("../../src/app");
const { createInternWithProfile, authHeader } = require("../helpers/factories");
const ExternalJobListing = require("../../src/modules/job-agent/models/ExternalJobListing");
const JobProviderHealth = require("../../src/modules/job-agent/models/JobProviderHealth");

jest.mock("../../src/modules/job-agent/providers/remotive.provider");
jest.mock("../../src/modules/job-agent/providers/adzuna.provider");
jest.mock("../../src/modules/job-agent/providers/arbeitnow.provider");
jest.mock("../../src/modules/job-agent/providers/themuse.provider");
jest.mock("../../src/modules/job-agent/providers/remoteok.provider");
jest.mock("../../src/modules/job-agent/providers/greenhouse.provider");
jest.mock("../../src/modules/job-agent/providers/lever.provider");
jest.mock("../../src/modules/job-agent/providers/jooble.provider");

const remotiveProvider = require("../../src/modules/job-agent/providers/remotive.provider");
const adzunaProvider = require("../../src/modules/job-agent/providers/adzuna.provider");
const arbeitnowProvider = require("../../src/modules/job-agent/providers/arbeitnow.provider");
const themuseProvider = require("../../src/modules/job-agent/providers/themuse.provider");
const remoteokProvider = require("../../src/modules/job-agent/providers/remoteok.provider");
const greenhouseProvider = require("../../src/modules/job-agent/providers/greenhouse.provider");
const leverProvider = require("../../src/modules/job-agent/providers/lever.provider");
const joobleProvider = require("../../src/modules/job-agent/providers/jooble.provider");

const { discoverExternalJobs } = require("../../src/modules/job-agent/services/job-discovery.service");

function okJob(overrides = {}) {
  return {
    source: "remotive",
    sourceId: "1",
    title: "Backend Intern",
    companyName: "Acme",
    location: "Remote",
    workMode: "remote",
    jobType: "internship",
    salaryMin: null,
    salaryMax: null,
    salaryCurrency: "",
    category: "Engineering",
    description: "Build things",
    applyUrl: "https://example.com/jobs/1",
    postedAt: new Date(),
    raw: null,
    ...overrides
  };
}

function stubEveryOtherProviderAsSkipped() {
  adzunaProvider.fetchJobs.mockResolvedValue({ ok: true, skipped: true, reason: "missing_credentials", jobs: [] });
  arbeitnowProvider.fetchJobs.mockResolvedValue({ ok: true, skipped: true, reason: "disabled", jobs: [] });
  themuseProvider.fetchJobs.mockResolvedValue({ ok: true, skipped: true, reason: "disabled", jobs: [] });
  remoteokProvider.fetchJobs.mockResolvedValue({ ok: true, skipped: true, reason: "disabled", jobs: [] });
  greenhouseProvider.fetchJobs.mockResolvedValue({ ok: true, skipped: true, reason: "no_board_tokens_configured", jobs: [] });
  leverProvider.fetchJobs.mockResolvedValue({ ok: true, skipped: true, reason: "no_company_slugs_configured", jobs: [] });
  joobleProvider.fetchJobs.mockResolvedValue({ ok: true, skipped: true, reason: "missing_credentials", jobs: [] });
}

describe("discoverExternalJobs pipeline", () => {
  beforeEach(() => {
    stubEveryOtherProviderAsSkipped();
  });

  test("upserts jobs from a successful provider and persists its health as ok", async () => {
    remotiveProvider.fetchJobs.mockResolvedValue({ ok: true, skipped: false, jobs: [okJob()] });

    await discoverExternalJobs();

    const listing = await ExternalJobListing.findOne({ source: "remotive", sourceId: "1" });
    expect(listing).toBeTruthy();
    expect(listing.title).toBe("Backend Intern");
    expect(listing.isActive).toBe(true);

    const health = await JobProviderHealth.findOne({ source: "remotive" });
    expect(health.status).toBe("ok");
    expect(health.jobsFetched).toBe(1);
    expect(health.lastSuccessAt).toBeTruthy();
  });

  test("one provider's failure never blocks another provider's jobs, and is recorded as failed", async () => {
    remotiveProvider.fetchJobs.mockResolvedValue({ ok: false, skipped: false, reason: "remotive_http_500", jobs: [] });

    await discoverExternalJobs();

    const health = await JobProviderHealth.findOne({ source: "remotive" });
    expect(health.status).toBe("failed");
    expect(health.reason).toBe("remotive_http_500");

    const adzunaHealth = await JobProviderHealth.findOne({ source: "adzuna" });
    expect(adzunaHealth.status).toBe("needs_credentials");
  });

  test("a job no longer reported by its source in a later sweep is deactivated, not deleted", async () => {
    remotiveProvider.fetchJobs.mockResolvedValueOnce({ ok: true, skipped: false, jobs: [okJob({ sourceId: "1" }), okJob({ sourceId: "2" })] });
    await discoverExternalJobs();

    let listings = await ExternalJobListing.find({ source: "remotive" }).lean();
    expect(listings.filter((l) => l.isActive)).toHaveLength(2);

    // Second sweep: source "1" has expired/been removed, only "2" remains.
    remotiveProvider.fetchJobs.mockResolvedValueOnce({ ok: true, skipped: false, jobs: [okJob({ sourceId: "2" })] });
    await discoverExternalJobs();

    listings = await ExternalJobListing.find({ source: "remotive" }).lean();
    const byId = Object.fromEntries(listings.map((l) => [l.sourceId, l.isActive]));
    expect(byId["1"]).toBe(false);
    expect(byId["2"]).toBe(true);
    // Never deleted -- just deactivated, so a tracked application that
    // references it (jobRef "1") still has somewhere to resolve back to.
    expect(listings).toHaveLength(2);
  });

  test("stub providers with no legitimate public API are recorded with their own distinct status", async () => {
    await discoverExternalJobs();
    const naukriHealth = await JobProviderHealth.findOne({ source: "naukri" });
    expect(naukriHealth.status).toBe("no_legitimate_api");
  });
});

describe("GET /api/job-agent/providers", () => {
  test("reports every named source, including ones with no DB health record yet, without fabricating success", async () => {
    const { user } = await createInternWithProfile();
    const res = await request(app).get("/api/job-agent/providers").set(authHeader(user));
    expect(res.status).toBe(200);
    const bySource = Object.fromEntries(res.body.data.providers.map((p) => [p.source, p]));
    expect(bySource.naukri.status).toBe("no_legitimate_api");
    expect(bySource.linkedin.status).toBe("no_legitimate_api");
    expect(bySource.indeed.status).toBe("no_legitimate_api");
    expect(bySource.wellfound.status).toBe("no_legitimate_api");
  });

  test("reflects a real recorded sweep result", async () => {
    stubEveryOtherProviderAsSkipped();
    remotiveProvider.fetchJobs.mockResolvedValue({ ok: true, skipped: false, jobs: [okJob()] });
    await discoverExternalJobs();

    const { user } = await createInternWithProfile();
    const res = await request(app).get("/api/job-agent/providers").set(authHeader(user));
    const bySource = Object.fromEntries(res.body.data.providers.map((p) => [p.source, p]));
    expect(bySource.remotive.status).toBe("ok");
    expect(bySource.remotive.jobsFetched).toBe(1);
  });
});
