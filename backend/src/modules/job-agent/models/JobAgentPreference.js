const mongoose = require("mongoose");

const WORK_MODES = ["remote", "on-site", "hybrid", "any"];
const EXPERIENCE_LEVELS = ["intern", "fresher", "0-1 years", "1-3 years", "3+ years"];

const jobAgentPreferenceSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true
    },
    internProfile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "InternProfile",
      required: true,
      index: true
    },
    enabled: { type: Boolean, default: false },
    desiredRoles: [{ type: String, trim: true }],
    locations: [{ type: String, trim: true }],
    workMode: { type: String, enum: WORK_MODES, default: "any" },
    minSalary: { type: Number, default: null, min: 0 },
    salaryCurrency: { type: String, default: "INR", trim: true },
    experienceLevel: { type: String, enum: EXPERIENCE_LEVELS, default: "intern" },
    notificationFrequency: {
      type: String,
      enum: ["realtime", "daily", "weekly"],
      default: "daily"
    },
    lastSweepAt: { type: Date, default: null },
    lastNotifiedAt: { type: Date, default: null },
    lastSweepMatchCount: { type: Number, default: 0 },
    pausedAt: { type: Date, default: null },
    pausedReason: { type: String, default: "", trim: true }
  },
  { timestamps: true }
);

jobAgentPreferenceSchema.index({ enabled: 1, lastSweepAt: 1 });

module.exports = mongoose.model("JobAgentPreference", jobAgentPreferenceSchema);
module.exports.WORK_MODES = WORK_MODES;
module.exports.EXPERIENCE_LEVELS = EXPERIENCE_LEVELS;
