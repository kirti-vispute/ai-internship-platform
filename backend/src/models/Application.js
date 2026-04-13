const mongoose = require("mongoose");
const { APPLICATION_STATUS } = require("../constants/enums");

const applicationSchema = new mongoose.Schema(
  {
    internId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "InternProfile",
      required: true,
      index: true
    },
    internshipId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Internship",
      required: true,
      index: true
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CompanyProfile",
      required: true,
      index: true
    },
    // Backward-compatible mirrored refs for existing populate/query paths.
    intern: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "InternProfile",
      required: true
    },
    internship: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Internship",
      required: true
    },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CompanyProfile",
      required: true
    },
    status: {
      type: String,
      enum: Object.values(APPLICATION_STATUS),
      default: APPLICATION_STATUS.APPLIED
    },
    appliedAt: {
      type: Date,
      default: Date.now
    },
    attachedResumePath: {
      type: String,
      required: true,
      trim: true
    },
    availabilityStatus: {
      type: String,
      enum: ["yes", "no"],
      required: true
    },
    joiningDate: {
      type: Date,
      default: null
    },
    relevanceScore: { type: Number, default: 0 },
    // Keep matchScore for existing UI/API compatibility.
    matchScore: { type: Number, default: 0 },
    relevanceBreakdown: { type: mongoose.Schema.Types.Mixed, default: null },
    stageHistory: [
      {
        stage: { type: String, enum: Object.values(APPLICATION_STATUS) },
        note: { type: String, default: "" },
        changedAt: { type: Date, default: Date.now }
      }
    ],
    hrFeedback: [
      {
        feedback: { type: String, required: true },
        createdAt: { type: Date, default: Date.now }
      }
    ],
    interviewRounds: [
      {
        roundType: { type: String, default: "" },
        interviewDate: { type: Date, default: null },
        interviewTime: { type: String, default: "" },
        mode: { type: String, enum: ["online", "offline", ""], default: "" },
        meetingLink: { type: String, default: "" },
        location: { type: String, default: "" },
        notes: { type: String, default: "" },
        status: {
          type: String,
          enum: ["scheduled", "completed", "cleared", "rejected"],
          default: "scheduled"
        },
        updatedAt: { type: Date, default: Date.now }
      }
    ]
  },
  { timestamps: true }
);

applicationSchema.pre("validate", function syncLinkedIds(next) {
  if (this.internId && !this.intern) this.intern = this.internId;
  if (this.intern && !this.internId) this.internId = this.intern;

  if (this.internshipId && !this.internship) this.internship = this.internshipId;
  if (this.internship && !this.internshipId) this.internshipId = this.internship;

  if (this.companyId && !this.company) this.company = this.companyId;
  if (this.company && !this.companyId) this.companyId = this.company;

  if (!this.appliedAt) {
    this.appliedAt = this.createdAt || new Date();
  }

  next();
});

applicationSchema.index({ internId: 1, internshipId: 1 }, { unique: true });
applicationSchema.index({ companyId: 1, internshipId: 1 });

module.exports = mongoose.model("Application", applicationSchema);

