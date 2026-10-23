const mongoose = require("mongoose");

/**
 * One document per job-data provider, updated after every discovery sweep.
 * Backs the dashboard's "provider health / last successful sync" panel --
 * a single shared, cheap-to-read collection instead of recomputing health
 * from ExternalJobListing on every request.
 */
const jobProviderHealthSchema = new mongoose.Schema(
  {
    source: { type: String, required: true, unique: true, trim: true },
    // "ok" | "failed" | "skipped" | "needs_credentials"
    status: { type: String, required: true, default: "skipped" },
    reason: { type: String, default: "" },
    jobsFetched: { type: Number, default: 0 },
    lastRunAt: { type: Date, default: null },
    lastSuccessAt: { type: Date, default: null }
  },
  { timestamps: true }
);

module.exports = mongoose.model("JobProviderHealth", jobProviderHealthSchema);
