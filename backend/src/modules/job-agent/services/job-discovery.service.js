const { PLATFORM_CONFIG } = require("../../../shared/config/platform.config");
const ExternalJobListing = require("../models/ExternalJobListing");
const JobProviderHealth = require("../models/JobProviderHealth");
const remotiveProvider = require("../providers/remotive.provider");
const adzunaProvider = require("../providers/adzuna.provider");
const arbeitnowProvider = require("../providers/arbeitnow.provider");
const themuseProvider = require("../providers/themuse.provider");
const remoteokProvider = require("../providers/remoteok.provider");
const greenhouseProvider = require("../providers/greenhouse.provider");
const leverProvider = require("../providers/lever.provider");
const joobleProvider = require("../providers/jooble.provider");
const naukriProvider = require("../providers/naukri.provider");
const linkedinProvider = require("../providers/linkedin.provider");
const indeedProvider = require("../providers/indeed.provider");
const wellfoundProvider = require("../providers/wellfound.provider");
const {
  getCanonicalSkillVocabulary,
  textMentionsSkill
} = require("../../../shared/utils/skill-normalizer");
const { isSafeHttpUrl } = require("../../../shared/utils/url-validator");

/**
 * Orchestrates every job-data provider behind one clean interface:
 * discoverExternalJobs() fetches from whichever providers are configured,
 * normalizes + extracts skills, upserts into the shared ExternalJobListing
 * cache, deactivates listings a source no longer reports (so removed/expired
 * postings stop showing up without ever being guessed at), and persists a
 * per-provider health record the dashboard can read directly. A provider
 * that is disabled, missing credentials/config, or failing never stops the
 * others and never fabricates a result -- each provider's own outcome
 * (ok / skipped / jobs fetched) is reported back untouched.
 *
 * Internal CareerSetu internships are intentionally NOT handled here -- they
 * are queried live from the existing Internship collection at serve time
 * (see the matching/feed service), never duplicated into this cache.
 */

const CANONICAL_SKILLS = getCanonicalSkillVocabulary();

// Broad, role-agnostic default search terms covering the categories the
// product is aimed at (software engineering, AI/ML, data science,
// internships) -- per-user relevance is handled later by the fit-scoring
// engine against each candidate's own preferences, not by narrowing the
// shared fetch itself.
const DEFAULT_REMOTIVE_CATEGORY = "software-dev";
const DEFAULT_ADZUNA_QUERY = "software engineer OR developer OR data science OR machine learning";
const DEFAULT_JOOBLE_KEYWORDS = "software engineer intern";

function extractSkillsFromText(text) {
  if (!text) return [];
  const found = [];
  for (const skill of CANONICAL_SKILLS) {
    if (textMentionsSkill(text, skill)) {
      found.push(skill);
    }
  }
  return found;
}

async function upsertListing(normalizedJob) {
  if (!isSafeHttpUrl(normalizedJob.applyUrl)) {
    throw new Error(`Invalid or unsafe applyUrl protocol: ${normalizedJob.applyUrl}`);
  }

  const searchableText = [
    normalizedJob.title,
    normalizedJob.category,
    normalizedJob.description
  ].join(" ");

  const extractedSkills = extractSkillsFromText(searchableText);

  await ExternalJobListing.findOneAndUpdate(
    { source: normalizedJob.source, sourceId: normalizedJob.sourceId },
    {
      $set: {
        title: normalizedJob.title,
        companyName: normalizedJob.companyName,
        location: normalizedJob.location,
        workMode: normalizedJob.workMode,
        jobType: normalizedJob.jobType,
        salaryMin: normalizedJob.salaryMin,
        salaryMax: normalizedJob.salaryMax,
        salaryCurrency: normalizedJob.salaryCurrency,
        category: normalizedJob.category,
        description: normalizedJob.description,
        extractedSkills,
        applyUrl: normalizedJob.applyUrl,
        postedAt: normalizedJob.postedAt,
        fetchedAt: new Date(),
        isActive: true,
        raw: normalizedJob.raw || null
      }
    },
    { upsert: true, new: true }
  );
}

/**
 * Marks every still-active listing for `source` that was NOT seen in this
 * sweep (its sourceId isn't in `seenSourceIds`) as inactive. This is how
 * removed/expired external postings stop appearing in the feed -- a
 * listing is only ever retired because the provider stopped reporting it,
 * never guessed at from its age.
 */
async function deactivateStaleListings(source, seenSourceIds) {
  if (!seenSourceIds.length) return 0;
  const result = await ExternalJobListing.updateMany(
    { source, isActive: true, sourceId: { $nin: seenSourceIds } },
    { $set: { isActive: false } }
  );
  return result.modifiedCount || 0;
}

async function recordProviderHealth(providerName, { status, reason, jobsFetched }) {
  const now = new Date();
  const update = {
    status,
    reason: reason || "",
    jobsFetched,
    lastRunAt: now
  };
  if (status === "ok") {
    update.lastSuccessAt = now;
  }
  await JobProviderHealth.findOneAndUpdate(
    { source: providerName },
    { $set: update },
    { upsert: true }
  );
}

async function runProvider(providerName, fetchFn, fetchArgs) {
  const result = await fetchFn(fetchArgs).catch((error) => ({
    ok: false,
    skipped: false,
    reason: "provider_threw",
    error: error?.message || String(error),
    jobs: []
  }));

  if (result.skipped || !result.ok) {
    const status = result.skipped
      ? (result.reason === "missing_credentials" || result.reason === "no_board_tokens_configured" || result.reason === "no_company_slugs_configured"
        ? "needs_credentials"
        : (result.reason === "no_legitimate_public_api" ? "no_legitimate_api" : "skipped"))
      : "failed";
    await recordProviderHealth(providerName, { status, reason: result.reason, jobsFetched: 0 });
    return {
      provider: providerName,
      ok: Boolean(result.ok),
      skipped: Boolean(result.skipped),
      reason: result.reason || null,
      fetched: 0,
      upserted: 0,
      failed: 0,
      deactivated: 0
    };
  }

  let upserted = 0;
  let failed = 0;
  const seenSourceIds = [];

  for (const job of result.jobs) {
    seenSourceIds.push(job.sourceId);
    try {
      await upsertListing(job);
      upserted += 1;
    } catch (error) {
      failed += 1;
      // A single malformed/duplicate-key failure must never abort the rest
      // of the sweep -- log and move on to the next listing.
      // eslint-disable-next-line no-console
      console.error(`[job-agent] failed to upsert ${providerName} job ${job.sourceId}:`, error.message);
    }
  }

  const deactivated = await deactivateStaleListings(providerName, seenSourceIds);

  await recordProviderHealth(providerName, {
    status: result.partialFailures?.length ? "partial" : "ok",
    reason: result.partialFailures?.length ? result.partialFailures.join("; ") : "",
    jobsFetched: result.jobs.length
  });

  return {
    provider: providerName,
    ok: true,
    skipped: false,
    reason: result.partialFailures?.length ? result.partialFailures.join("; ") : null,
    fetched: result.jobs.length,
    upserted,
    failed,
    deactivated
  };
}

/**
 * Runs one discovery pass across every configured external provider.
 * Returns a per-provider summary; never throws, so a scheduler sweep or a
 * manual "refresh now" call always gets a usable report even if every
 * provider failed.
 */
async function discoverExternalJobs() {
  const config = PLATFORM_CONFIG.jobAgent;
  const limit = config.maxJobsPerSweep || 200;

  const results = await Promise.all([
    runProvider("remotive", remotiveProvider.fetchJobs, { category: DEFAULT_REMOTIVE_CATEGORY, limit }),
    runProvider("adzuna", adzunaProvider.fetchJobs, { what: DEFAULT_ADZUNA_QUERY, resultsPerPage: Math.min(limit, 50) }),
    runProvider("arbeitnow", arbeitnowProvider.fetchJobs, { limit }),
    runProvider("themuse", themuseProvider.fetchJobs, { limit }),
    runProvider("remoteok", remoteokProvider.fetchJobs, { limit }),
    runProvider("greenhouse", greenhouseProvider.fetchJobs, { limit }),
    runProvider("lever", leverProvider.fetchJobs, { limit }),
    runProvider("jooble", joobleProvider.fetchJobs, { keywords: DEFAULT_JOOBLE_KEYWORDS, limit }),
    runProvider("naukri", naukriProvider.fetchJobs, {}),
    runProvider("linkedin", linkedinProvider.fetchJobs, {}),
    runProvider("indeed", indeedProvider.fetchJobs, {}),
    runProvider("wellfound", wellfoundProvider.fetchJobs, {})
  ]);

  return {
    ranAt: new Date(),
    providers: results
  };
}

module.exports = { discoverExternalJobs, extractSkillsFromText };
