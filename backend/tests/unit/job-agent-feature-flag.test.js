// feature-flags.js computes FEATURE_FLAGS once at require-time and freezes
// it (by design -- flags are boot-time config, not live-reloadable, same
// as every other flag in this file). So verifying both states means
// re-requiring job-agent.routes.js (which destructures `isEnabled` from it
// at require-time) fresh under each env value, mirroring what actually
// happens across a real process restart with a different env var.
//
// This must go through jest.resetModules(), not manual require.cache
// deletion: Jest's test code sees its own per-file module registry, not
// Node's native one, and on Windows the two can disagree on how a resolved
// path is keyed, so `delete require.cache[path]` silently misses and the
// *previous* test's frozen (and here, wrong) FEATURE_FLAGS object leaks
// into this one -- every test after the first then sees whatever value the
// very first test's require captured, regardless of its own env var.
// jest.resetModules() is Jest's own supported reset path and isn't subject
// to that mismatch.
function loadEnsureJobAgentEnabled() {
  jest.resetModules();
  // eslint-disable-next-line global-require
  return require("../../src/modules/job-agent/routes/job-agent.routes.js").ensureJobAgentEnabled;
}

describe("Job Agent ENABLE_JOB_AGENT feature flag", () => {
  const originalValue = process.env.ENABLE_JOB_AGENT;

  afterEach(() => {
    if (originalValue === undefined) delete process.env.ENABLE_JOB_AGENT;
    else process.env.ENABLE_JOB_AGENT = originalValue;
    jest.resetModules();
  });

  // Regression test: before this fix, ENABLE_JOB_AGENT=false only stopped
  // the scheduler and hid the sidebar link -- every API endpoint stayed
  // reachable. This mirrors the ENABLE_INTERVIEW_ROOMS convention used
  // elsewhere in the codebase (interview.controller.js's
  // ensureInterviewRoomsEnabled), which throws a 503 at the API layer.
  test("throws a 503 AppError when ENABLE_JOB_AGENT=false at boot", () => {
    process.env.ENABLE_JOB_AGENT = "false";
    const ensureJobAgentEnabled = loadEnsureJobAgentEnabled();

    let caught = null;
    try {
      ensureJobAgentEnabled();
    } catch (e) {
      caught = e;
    }
    expect(caught).not.toBeNull();
    expect(caught.statusCode).toBe(503);
    expect(caught.code).toBe("JOB_AGENT_DISABLED");
  });

  test("does not throw when ENABLE_JOB_AGENT=true at boot (the default)", () => {
    process.env.ENABLE_JOB_AGENT = "true";
    const ensureJobAgentEnabled = loadEnsureJobAgentEnabled();
    expect(() => ensureJobAgentEnabled()).not.toThrow();
  });

  test("defaults to enabled when ENABLE_JOB_AGENT is unset", () => {
    delete process.env.ENABLE_JOB_AGENT;
    const ensureJobAgentEnabled = loadEnsureJobAgentEnabled();
    expect(() => ensureJobAgentEnabled()).not.toThrow();
  });
});
