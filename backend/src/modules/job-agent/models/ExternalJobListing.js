const mongoose = require("mongoose");

// External-only job sources. Internal CareerSetu internships are NOT mirrored
// into this collection -- the job feed merges this cache with a live query
// against the existing Internship collection at request time, so internal
// listings never go stale and never get duplicated into a second store.
const EXTERNAL_SOURCES = [
  "remotive",
  "adzuna",
  "arbeitnow",
  "themuse",
  "remoteok",
  "greenhouse",
  "lever",
  "jooble",
  "naukri",
  "linkedin",
  "indeed",
  "wellfound"
];

const externalJobListingSchema = new mongoose.Schema(
  {
    source: { type: String, enum: EXTERNAL_SOURCES, required: true, index: true },
    // The id the provider itself uses for this job -- used for dedup.
    sourceId: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    companyName: { type: String, default: "", trim: true },
    location: { type: String, default: "", trim: true },
    workMode: { type: String, enum: ["remote", "on-site", "hybrid", ""], default: "" },
    jobType: { type: String, default: "", trim: true }, // full_time, internship, contract, ...
    salaryMin: { type: Number, default: null },
    salaryMax: { type: Number, default: null },
    salaryCurrency: { type: String, default: "", trim: true },
    category: { type: String, default: "", trim: true },
    description: { type: String, default: "", trim: true },
    // Lightweight keyword-extracted skills from title/description/tags --
    // external providers don't give structured skill arrays like internal
    // Internship docs do, so this is an approximation used only for matching.
    extractedSkills: [{ type: String, trim: true }],
    // Always the provider's own listing page -- never rewritten to point
    // anywhere else, so applying always goes to the real original source.
    applyUrl: { type: String, required: true, trim: true },
    postedAt: { type: Date, default: null },
    fetchedAt: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: true },
    raw: { type: mongoose.Schema.Types.Mixed, default: null }
  },
  { timestamps: true }
);

externalJobListingSchema.index({ source: 1, sourceId: 1 }, { unique: true });
externalJobListingSchema.index({ isActive: 1, fetchedAt: -1 });
externalJobListingSchema.index({ extractedSkills: 1 });

module.exports = mongoose.model("ExternalJobListing", externalJobListingSchema);
module.exports.EXTERNAL_SOURCES = EXTERNAL_SOURCES;
