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
    experience: [{ type: String, trim: true }],
    achievements: [{ type: String, trim: true }],
    links: [{ type: String, trim: true }],
    linkedinUrl: { type: String, default: "", trim: true },
    summary: { type: String, default: "", trim: true },
    interests: [{ type: String, trim: true }],
    completedCourses: [{ type: String, trim: true }],
    profileSections: {
      personalInformation: {
        location: { type: String, default: "", trim: true },
        headline: { type: String, default: "", trim: true }
      },
      professionalSummary: { type: String, default: "", trim: true },
      education: [{ degree: String, institution: String, startYear: String, endYear: String, grade: String }],
      experience: [{ role: String, company: String, duration: String, description: String }],
      projects: [{ title: String, description: String, techStack: [String], demoLink: String }],
      certifications: [{ name: String, issuer: String, year: String }],
      skills: [{ type: String, trim: true }],
      socialLinks: [{ platform: String, url: String }],
      achievements: [{ type: String, trim: true }]
    },
    savedInternships: [{ type: mongoose.Schema.Types.ObjectId, ref: "Internship" }],
    resume: {
      filePath: { type: String, default: "" },
      text: { type: String, default: "" },
      score: { type: Number, default: 0 },
      scoreSource: { type: String, default: "none" },
      predictedCategory: { type: String, default: "" },
      confidence: { type: Number, default: null },
      analysis: { type: mongoose.Schema.Types.Mixed, default: null },
      parsed: { type: mongoose.Schema.Types.Mixed, default: null }
    }
  },
  { timestamps: true }
);

internProfileSchema.index({ skills: 1 });
internProfileSchema.index({ createdAt: -1 });

module.exports = mongoose.model("InternProfile", internProfileSchema);
