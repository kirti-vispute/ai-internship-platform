const mongoose = require("mongoose");

const internProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true
    },
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    mobile: { type: String, required: true, trim: true },
    skills: [{ type: String, trim: true }],
    education: [{ type: String, trim: true }],
    projects: [{ type: String, trim: true }],
    certifications: [{ type: String, trim: true }],
    interests: [{ type: String, trim: true }],
    completedCourses: [{ type: String, trim: true }],
    resume: {
      filePath: { type: String, default: "" },
      text: { type: String, default: "" },
      score: { type: Number, default: 0 },
      scoreSource: { type: String, default: "none" },
      predictedCategory: { type: String, default: "" },
      confidence: { type: Number, default: null },
      analysis: { type: mongoose.Schema.Types.Mixed, default: null }
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("InternProfile", internProfileSchema);
