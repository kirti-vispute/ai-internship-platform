// Unit tests for every AI Job Agent provider adapter. Each provider's
// fetchJobs() contract is "never throws, always resolves to
// {ok, skipped, reason, jobs}" -- these tests exercise that contract
// directly against a mocked global.fetch, so no network or database access
// is needed.
//
// Provider config (enabled flags, credentials, board tokens) is read from
// PLATFORM_CONFIG at require-time and frozen, exactly like
// job-agent-feature-flag.test.js's FEATURE_FLAGS -- so toggling an env var
// between tests requires jest.resetModules() + a fresh require, not just
// reassigning process.env after the module is already loaded.
function freshRequire(modulePath) {
  jest.resetModules();
  // eslint-disable-next-line global-require, import/no-dynamic-require
  return require(modulePath);
}

function mockFetchOnce(responses) {
  const queue = Array.isArray(responses) ? [...responses] : [responses];
  global.fetch = jest.fn(() => {
    const next = queue.length > 1 ? queue.shift() : queue[0];
    if (next.throws) return Promise.reject(next.throws);
    return Promise.resolve({
      ok: next.ok !== false,
      status: next.status || 200,
      json: () => Promise.resolve(next.body)
    });
  });
}

const ENV_KEYS = [
  "JOB_PROVIDER_ARBEITNOW_ENABLED",
  "JOB_PROVIDER_THEMUSE_ENABLED",
  "JOB_PROVIDER_REMOTEOK_ENABLED",
  "JOB_PROVIDER_GREENHOUSE_ENABLED",
  "JOB_PROVIDER_GREENHOUSE_BOARD_TOKENS",
  "JOB_PROVIDER_LEVER_ENABLED",
  "JOB_PROVIDER_LEVER_COMPANY_SLUGS",
  "JOB_PROVIDER_JOOBLE_ENABLED",
  "JOOBLE_API_KEY"
];
const originalEnv = {};
ENV_KEYS.forEach((k) => { originalEnv[k] = process.env[k]; });

afterEach(() => {
  ENV_KEYS.forEach((k) => {
    if (originalEnv[k] === undefined) delete process.env[k];
    else process.env[k] = originalEnv[k];
  });
  delete global.fetch;
  jest.resetModules();
});

describe("arbeitnow.provider (keyless public API)", () => {
  test("normalizes real-shaped Arbeitnow listings", async () => {
    mockFetchOnce({
      body: {
        data: [
          { slug: "job-1", title: "Backend Intern", company_name: "Acme", url: "https://arbeitnow.com/jobs/job-1", location: "Berlin", remote: true, job_types: ["Internship"], tags: ["node"], description: "<p>Build APIs</p>", created_at: 1700000000 }
        ]
      }
    });
    const { fetchJobs } = freshRequire("../../src/modules/job-agent/providers/arbeitnow.provider");
    const result = await fetchJobs({ limit: 10 });
    expect(result.ok).toBe(true);
    expect(result.jobs).toHaveLength(1);
    expect(result.jobs[0]).toMatchObject({ source: "arbeitnow", sourceId: "job-1", title: "Backend Intern", workMode: "remote", jobType: "internship" });
    expect(result.jobs[0].description).toBe("Build APIs");
    expect(result.jobs[0].postedAt).toEqual(new Date(1700000000 * 1000));
  });

  test("drops malformed entries missing required fields instead of throwing", async () => {
    mockFetchOnce({ body: { data: [{ title: "No slug or url" }] } });
    const { fetchJobs } = freshRequire("../../src/modules/job-agent/providers/arbeitnow.provider");
    const result = await fetchJobs({});
    expect(result.ok).toBe(true);
    expect(result.jobs).toEqual([]);
  });

  test("is skipped (not failed) when disabled via env", async () => {
    process.env.JOB_PROVIDER_ARBEITNOW_ENABLED = "false";
    const { fetchJobs } = freshRequire("../../src/modules/job-agent/providers/arbeitnow.provider");
    const result = await fetchJobs({});
    expect(result).toEqual({ ok: true, skipped: true, reason: "disabled", jobs: [] });
  });

  test("reports a non-200 response as a failure, not a thrown error", async () => {
    mockFetchOnce({ ok: false, status: 503 });
    const { fetchJobs } = freshRequire("../../src/modules/job-agent/providers/arbeitnow.provider");
    const result = await fetchJobs({});
    expect(result.ok).toBe(false);
    expect(result.reason).toBe("arbeitnow_http_503");
    expect(result.jobs).toEqual([]);
  });

  test("reports a network-level throw as a failure, not an unhandled rejection", async () => {
    mockFetchOnce({ throws: new Error("ECONNRESET") });
    const { fetchJobs } = freshRequire("../../src/modules/job-agent/providers/arbeitnow.provider");
    const result = await fetchJobs({});
    expect(result.ok).toBe(false);
    expect(result.reason).toContain("arbeitnow_");
  });
});

describe("themuse.provider (keyless, provider-stated seniority levels)", () => {
  test("normalizes listings and classifies an Internship-level posting via jobType", async () => {
    mockFetchOnce({
      body: {
        results: [
          {
            id: 55,
            name: "Data Science Intern",
            company: { name: "Globex" },
            locations: [{ name: "Remote" }],
            levels: [{ name: "Internship" }],
            categories: [{ name: "Data Science" }],
            contents: "<p>Analyze data</p>",
            publication_date: "2026-01-01T00:00:00Z",
            refs: { landing_page: "https://themuse.com/jobs/55" }
          }
        ]
      }
    });
    const { fetchJobs } = freshRequire("../../src/modules/job-agent/providers/themuse.provider");
    const result = await fetchJobs({ levelFilter: "Internship" });
    expect(result.ok).toBe(true);
    expect(result.jobs[0]).toMatchObject({ source: "themuse", sourceId: "55", jobType: "internship", workMode: "remote" });
    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining("level=Internship"), expect.anything());
  });

  test("drops a listing with no landing_page link", async () => {
    mockFetchOnce({ body: { results: [{ id: 1, name: "X", refs: {} }] } });
    const { fetchJobs } = freshRequire("../../src/modules/job-agent/providers/themuse.provider");
    const result = await fetchJobs({});
    expect(result.jobs).toEqual([]);
  });
});

describe("remoteok.provider (keyless, skips the feed's own legal-notice element)", () => {
  test("skips the first legal-notice element and normalizes real job entries", async () => {
    mockFetchOnce({
      body: [
        { legal: "API Terms of Service..." },
        { id: 777, position: "DevOps Engineer", company: "Initech", url: "https://remoteok.com/remote-jobs/777", location: "Worldwide", tags: ["devops"], description: "Run infra", date: "2026-02-01T00:00:00Z", salary_min: 60000, salary_max: 90000 }
      ]
    });
    const { fetchJobs } = freshRequire("../../src/modules/job-agent/providers/remoteok.provider");
    const result = await fetchJobs({});
    expect(result.ok).toBe(true);
    expect(result.jobs).toHaveLength(1);
    expect(result.jobs[0]).toMatchObject({ source: "remoteok", sourceId: "777", workMode: "remote", salaryMin: 60000, salaryMax: 90000 });
    expect(result.jobs[0].raw.requiresAttribution).toBe(true);
  });
});

describe("greenhouse.provider (per-company board tokens, legitimate company-career-page API)", () => {
  test("is skipped when no board tokens are configured", async () => {
    delete process.env.JOB_PROVIDER_GREENHOUSE_BOARD_TOKENS;
    const { fetchJobs } = freshRequire("../../src/modules/job-agent/providers/greenhouse.provider");
    const result = await fetchJobs({});
    expect(result).toEqual({ ok: true, skipped: true, reason: "no_board_tokens_configured", jobs: [] });
  });

  test("fetches every configured board and tags each job with its board token as the company", async () => {
    process.env.JOB_PROVIDER_GREENHOUSE_BOARD_TOKENS = "acme";
    mockFetchOnce({ body: { jobs: [{ id: 1, title: "SWE Intern", absolute_url: "https://acme.com/jobs/1", location: { name: "Remote" }, updated_at: "2026-01-01T00:00:00Z", content: "<p>Code</p>", departments: [{ name: "Engineering" }] }] } });
    const { fetchJobs } = freshRequire("../../src/modules/job-agent/providers/greenhouse.provider");
    const result = await fetchJobs({});
    expect(result.ok).toBe(true);
    expect(result.jobs[0]).toMatchObject({ source: "greenhouse", sourceId: "acme:1", companyName: "acme", workMode: "remote" });
  });

  test("one board's failure never blocks another board's jobs, and is reported in partialFailures", async () => {
    process.env.JOB_PROVIDER_GREENHOUSE_BOARD_TOKENS = "goodco,badco";
    global.fetch = jest.fn((url) => {
      if (String(url).includes("badco")) return Promise.resolve({ ok: false, status: 404 });
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ jobs: [{ id: 2, title: "Backend Dev", absolute_url: "https://goodco.com/jobs/2", location: { name: "NY" } }] }) });
    });
    const { fetchJobs } = freshRequire("../../src/modules/job-agent/providers/greenhouse.provider");
    const result = await fetchJobs({});
    expect(result.ok).toBe(true);
    expect(result.jobs).toHaveLength(1);
    expect(result.jobs[0].companyName).toBe("goodco");
    expect(result.partialFailures).toEqual(["greenhouse_http_404"]);
  });
});

describe("lever.provider (per-company slugs, legitimate company-career-page API)", () => {
  test("is skipped when no company slugs are configured", async () => {
    delete process.env.JOB_PROVIDER_LEVER_COMPANY_SLUGS;
    const { fetchJobs } = freshRequire("../../src/modules/job-agent/providers/lever.provider");
    const result = await fetchJobs({});
    expect(result).toEqual({ ok: true, skipped: true, reason: "no_company_slugs_configured", jobs: [] });
  });

  test("normalizes a configured company's postings", async () => {
    process.env.JOB_PROVIDER_LEVER_COMPANY_SLUGS = "spotify";
    mockFetchOnce({ body: [{ id: "abc", text: "Mobile Engineer", hostedUrl: "https://jobs.lever.co/spotify/abc", categories: { location: "Remote - EMEA", team: "Engineering", commitment: "Full-time" }, descriptionPlain: "Build mobile apps", createdAt: 1700000000000 }] });
    const { fetchJobs } = freshRequire("../../src/modules/job-agent/providers/lever.provider");
    const result = await fetchJobs({});
    expect(result.ok).toBe(true);
    expect(result.jobs[0]).toMatchObject({ source: "lever", sourceId: "spotify:abc", companyName: "spotify", workMode: "remote" });
  });
});

describe("jooble.provider (optional API key)", () => {
  test("is skipped as missing_credentials when no API key is configured", async () => {
    delete process.env.JOOBLE_API_KEY;
    const { fetchJobs } = freshRequire("../../src/modules/job-agent/providers/jooble.provider");
    const result = await fetchJobs({});
    expect(result).toEqual({ ok: true, skipped: true, reason: "missing_credentials", jobs: [] });
  });

  test("POSTs to the key-scoped endpoint and normalizes results once configured", async () => {
    process.env.JOOBLE_API_KEY = "test-key-123";
    mockFetchOnce({ body: { jobs: [{ id: 9, title: "QA Intern", company: "Acme", link: "https://jooble.org/jobs/9", location: "Pune", snippet: "Test things", updated: "2026-01-01" }] } });
    const { fetchJobs } = freshRequire("../../src/modules/job-agent/providers/jooble.provider");
    const result = await fetchJobs({ keywords: "qa intern" });
    expect(result.ok).toBe(true);
    expect(result.jobs[0]).toMatchObject({ source: "jooble", sourceId: "9" });
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/test-key-123"),
      expect.objectContaining({ method: "POST" })
    );
  });
});

describe("naukri / linkedin / indeed / wellfound provider stubs", () => {
  test.each(["naukri", "linkedin", "indeed", "wellfound"])(
    "%s has no legitimate public API today and always reports skipped, never fabricating jobs",
    async (name) => {
      // eslint-disable-next-line global-require, import/no-dynamic-require
      const { fetchJobs, SOURCE } = require(`../../src/modules/job-agent/providers/${name}.provider`);
      const result = await fetchJobs();
      expect(SOURCE).toBe(name);
      expect(result).toEqual({ ok: true, skipped: true, reason: "no_legitimate_public_api", jobs: [] });
    }
  );
});
