// Live integration check for the AI Job Agent. Run from backend/ so relative
// requires resolve. NEVER logs the Groq API key value -- only boolean
// presence/length and provider responses that are themselves non-secret.
const path = require("path");
const BACKEND_DIR = path.join(__dirname, "..", "backend");
// `require("dotenv")` resolves relative to this file's own directory
// (_verify/), which has no node_modules of its own -- it always threw
// "Cannot find module 'dotenv'" regardless of cwd, even from the
// 3-live-check.bat wrapper that cd's into backend/ first (Node resolves
// modules by the requiring file's path, not cwd). Resolve it from
// backend/node_modules explicitly instead.
require(path.join(BACKEND_DIR, "node_modules", "dotenv")).config({ path: path.join(BACKEND_DIR, ".env") });

function section(title) {
  console.log("\n=== " + title + " ===");
}

async function main() {
  section("Environment");
  console.log("GROQ_API_KEY present:", Boolean(process.env.GROQ_API_KEY));
  console.log("GROQ_API_KEY length:", (process.env.GROQ_API_KEY || "").length);
  console.log("GROQ_MODEL:", process.env.GROQ_MODEL || "(default)");
  console.log("ADZUNA_APP_ID present:", Boolean(process.env.ADZUNA_APP_ID));
  console.log("ADZUNA_APP_KEY present:", Boolean(process.env.ADZUNA_APP_KEY));

  section("Groq live call");
  try {
    const { completeWithGroq } = require(path.join(BACKEND_DIR, "src/shared/infrastructure/ai/groq.provider"));
    const result = await completeWithGroq({
      systemPrompt: "Reply with exactly the single word OK and nothing else.",
      userPrompt: "ping"
    });
    console.log("GROQ_RESULT: SUCCESS");
    console.log("provider:", result.provider, "| model:", result.model, "| content:", JSON.stringify(result.content));
  } catch (err) {
    console.log("GROQ_RESULT: FAILED");
    console.log("error.message:", err.message);
    console.log("error.code:", err.code || "(none)");
    console.log("error.cause:", err.cause ? (err.cause.code || err.cause.message) : "(none)");
  }

  section("Remotive live fetch");
  try {
    const { fetchJobs } = require(path.join(BACKEND_DIR, "src/modules/job-agent/providers/remotive.provider"));
    const res = await fetchJobs({ limit: 3 });
    console.log("REMOTIVE_RESULT:", res.ok ? "SUCCESS" : "FAILED", "| skipped:", res.skipped, "| reason:", res.reason || "(none)");
    console.log("jobs fetched:", res.jobs.length);
    res.jobs.slice(0, 3).forEach((j) => console.log("  -", j.title, "@", j.companyName));
  } catch (err) {
    console.log("REMOTIVE_RESULT: THREW (should never happen -- provider is supposed to never throw)");
    console.log("error.message:", err.message);
  }

  section("Adzuna live fetch");
  try {
    const { fetchJobs, isCredentialed } = require(path.join(BACKEND_DIR, "src/modules/job-agent/providers/adzuna.provider"));
    const { PLATFORM_CONFIG } = require(path.join(BACKEND_DIR, "src/shared/config/platform.config"));
    console.log("Adzuna credentialed:", isCredentialed(PLATFORM_CONFIG.jobAgent.providers.adzuna));
    const res = await fetchJobs({ what: "software engineer intern", where: "india", resultsPerPage: 3 });
    console.log("ADZUNA_RESULT:", res.ok ? "SUCCESS" : "FAILED", "| skipped:", res.skipped, "| reason:", res.reason || "(none)");
    console.log("jobs fetched:", res.jobs.length);
    res.jobs.slice(0, 3).forEach((j) => console.log("  -", j.title, "@", j.companyName));
  } catch (err) {
    console.log("ADZUNA_RESULT: THREW (should never happen -- provider is supposed to never throw)");
    console.log("error.message:", err.message);
  }

  section("Arbeitnow live fetch (free, keyless)");
  try {
    const { fetchJobs } = require(path.join(BACKEND_DIR, "src/modules/job-agent/providers/arbeitnow.provider"));
    const res = await fetchJobs({ limit: 3 });
    console.log("ARBEITNOW_RESULT:", res.ok ? "SUCCESS" : "FAILED", "| skipped:", res.skipped, "| reason:", res.reason || "(none)");
    console.log("jobs fetched:", res.jobs.length);
    res.jobs.slice(0, 3).forEach((j) => console.log("  -", j.title, "@", j.companyName));
  } catch (err) {
    console.log("ARBEITNOW_RESULT: THREW");
    console.log("error.message:", err.message);
  }

  section("The Muse live fetch (free, keyless, Internship level filter)");
  try {
    const { fetchJobs } = require(path.join(BACKEND_DIR, "src/modules/job-agent/providers/themuse.provider"));
    const res = await fetchJobs({ levelFilter: "Internship", limit: 3 });
    console.log("THEMUSE_RESULT:", res.ok ? "SUCCESS" : "FAILED", "| skipped:", res.skipped, "| reason:", res.reason || "(none)");
    console.log("jobs fetched:", res.jobs.length);
    res.jobs.slice(0, 3).forEach((j) => console.log("  -", j.title, "@", j.companyName));
  } catch (err) {
    console.log("THEMUSE_RESULT: THREW");
    console.log("error.message:", err.message);
  }

  section("Remote OK live fetch (free, keyless)");
  try {
    const { fetchJobs } = require(path.join(BACKEND_DIR, "src/modules/job-agent/providers/remoteok.provider"));
    const res = await fetchJobs({ limit: 3 });
    console.log("REMOTEOK_RESULT:", res.ok ? "SUCCESS" : "FAILED", "| skipped:", res.skipped, "| reason:", res.reason || "(none)");
    console.log("jobs fetched:", res.jobs.length);
    res.jobs.slice(0, 3).forEach((j) => console.log("  -", j.title, "@", j.companyName));
  } catch (err) {
    console.log("REMOTEOK_RESULT: THREW");
    console.log("error.message:", err.message);
  }

  section("Greenhouse live fetch (company career pages -- real public board: stripe)");
  try {
    // Not read from backend/.env (which leaves this list empty by design --
    // see .env.example) -- set here only for this one-off live-access
    // demonstration, exactly like choosing a demo company, never persisted.
    process.env.JOB_PROVIDER_GREENHOUSE_BOARD_TOKENS = "stripe";
    delete require.cache[require.resolve(path.join(BACKEND_DIR, "src/shared/config/platform.config"))];
    const { fetchJobs } = require(path.join(BACKEND_DIR, "src/modules/job-agent/providers/greenhouse.provider"));
    const res = await fetchJobs({ limit: 3 });
    console.log("GREENHOUSE_RESULT:", res.ok ? "SUCCESS" : "FAILED", "| skipped:", res.skipped, "| reason:", res.reason || "(none)");
    console.log("jobs fetched:", res.jobs.length);
    res.jobs.slice(0, 3).forEach((j) => console.log("  -", j.title, "@", j.companyName));
  } catch (err) {
    console.log("GREENHOUSE_RESULT: THREW");
    console.log("error.message:", err.message);
  }

  section("Lever live fetch (company career pages -- real public board: spotify)");
  try {
    process.env.JOB_PROVIDER_LEVER_COMPANY_SLUGS = "spotify";
    delete require.cache[require.resolve(path.join(BACKEND_DIR, "src/shared/config/platform.config"))];
    const { fetchJobs } = require(path.join(BACKEND_DIR, "src/modules/job-agent/providers/lever.provider"));
    const res = await fetchJobs({ limit: 3 });
    console.log("LEVER_RESULT:", res.ok ? "SUCCESS" : "FAILED", "| skipped:", res.skipped, "| reason:", res.reason || "(none)");
    console.log("jobs fetched:", res.jobs.length);
    res.jobs.slice(0, 3).forEach((j) => console.log("  -", j.title, "@", j.companyName));
  } catch (err) {
    console.log("LEVER_RESULT: THREW");
    console.log("error.message:", err.message);
  }

  section("Jooble live fetch (optional API key)");
  try {
    const { fetchJobs, isCredentialed } = require(path.join(BACKEND_DIR, "src/modules/job-agent/providers/jooble.provider"));
    const { PLATFORM_CONFIG } = require(path.join(BACKEND_DIR, "src/shared/config/platform.config"));
    console.log("Jooble credentialed:", isCredentialed(PLATFORM_CONFIG.jobAgent.providers.jooble));
    const res = await fetchJobs({ keywords: "software engineer intern" });
    console.log("JOOBLE_RESULT:", res.ok ? "SUCCESS" : "FAILED", "| skipped:", res.skipped, "| reason:", res.reason || "(none)");
    console.log("jobs fetched:", res.jobs.length);
  } catch (err) {
    console.log("JOOBLE_RESULT: THREW");
    console.log("error.message:", err.message);
  }

  section("Done");
}

main().catch((e) => {
  console.error("FATAL:", e.message);
  process.exitCode = 1;
});
