const mongoose = require("mongoose");

const internshipSchema = new mongoose.Schema(
  {
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CompanyProfile",
      required: true
    },
    role: { type: String, required: true, trim: true },
    skillsRequired: [{ type: String, trim: true }],
    prioritySkills: [{ type: String, trim: true }],
    stipend: { type: String, default: "" },
    duration: { type: String, default: "" },
    location: { type: String, default: "" },
    description: { type: String, required: true, trim: true },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Internship", internshipSchema);
