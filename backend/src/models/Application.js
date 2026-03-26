const mongoose = require("mongoose");
const { APPLICATION_STATUS } = require("../constants/enums");

const applicationSchema = new mongoose.Schema(
  {
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
    status: {
      type: String,
      enum: Object.values(APPLICATION_STATUS),
      default: APPLICATION_STATUS.APPLIED
    },
    matchScore: { type: Number, default: 0 },
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
    ]
  },
  { timestamps: true }
);

applicationSchema.index({ intern: 1, internship: 1 }, { unique: true });

module.exports = mongoose.model("Application", applicationSchema);
