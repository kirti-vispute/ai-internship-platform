const fs = require("fs");
const path = require("path");
const User = require("../../models/User");
const InternProfile = require("../../models/InternProfile");
const CompanyProfile = require("../../models/CompanyProfile");
const Internship = require("../../models/Internship");
const Application = require("../../models/Application");
const ReportedCompany = require("../../models/ReportedCompany");
const { hashPassword } = require("../utils/password");
const seedData = require("./seedData");
const { computeResumeScore } = require("../../services/scorer.service");
const { buildSimplePdf } = require("../utils/simple-pdf");

const SEED_RESUME_DIR = path.join(__dirname, "../../modules/uploads/resumes");

async function resetCollections() {
  await Promise.all([
    User.deleteMany({}),
    InternProfile.deleteMany({}),
    CompanyProfile.deleteMany({}),
    Internship.deleteMany({}),
    Application.deleteMany({}),
    ReportedCompany.deleteMany({})
  ]);
}

async function seedDatabase({ reset = false } = {}) {
  if (!reset) {
    const existingUsers = await User.countDocuments();
    if (existingUsers > 0) {
      return { seeded: false, reason: "database-not-empty" };
    }
  } else {
    await resetCollections();
  }

  const usersByEmail = {};
  for (const userSeed of seedData.users) {
    const user = await User.create({
      email: userSeed.email,
      role: userSeed.role,
      passwordHash: await hashPassword(userSeed.password),
      adminRole: userSeed.adminRole || null,
      companyAccountType: userSeed.companyAccountType || null,
      displayName: userSeed.displayName || ""
    });
    usersByEmail[user.email] = user;
  }

const SEED_RESUME_PATH = "uploads/resumes/seed-resume.pdf";

function buildSeedSummary(profileSeed) {
  const skills = profileSeed.skills || [];
  return (
    `Aspiring software engineer with hands-on project experience in ${skills.slice(0, 3).join(", ")} and a` +
    " strong foundation in core computer science concepts, seeking an internship to apply and grow those skills."
  );
}

function buildSeedResumeLines(profileSeed) {
  const skills = profileSeed.skills || [];
  const education = profileSeed.education || [];
  const projects = profileSeed.projects || [];
  const certifications = profileSeed.certifications || [];

  const lines = [
    profileSeed.fullName.toUpperCase(),
    `${profileSeed.mobile} | ${profileSeed.email}`,
    "",
    buildSeedSummary(profileSeed),
    ""
  ];

  if (skills.length) {
    lines.push("TECHNICAL SKILLS", skills.join(", "), "");
  }

  if (projects.length) {
    lines.push("PROJECTS");
    projects.forEach((project) => lines.push(`- ${project}`));
    lines.push("");
  }

  if (certifications.length) {
    lines.push("CERTIFICATIONS");
    certifications.forEach((cert) => lines.push(`- ${cert}`));
    lines.push("");
  }

  if (education.length) {
    lines.push("EDUCATION");
    education.forEach((entry) => lines.push(entry));
  }

  return lines;
}

  fs.mkdirSync(SEED_RESUME_DIR, { recursive: true });

  const internProfilesByEmail = {};
  for (const profileSeed of seedData.internProfiles) {
    const user = usersByEmail[profileSeed.email];
    const lines = buildSeedResumeLines(profileSeed);
    const resumeText = lines.join("\n");
    const slug = profileSeed.email.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
    const resumeFileName = `seed-${slug}.pdf`;
    fs.writeFileSync(path.join(SEED_RESUME_DIR, resumeFileName), buildSimplePdf(lines));
    const resumeFilePath = `uploads/resumes/${resumeFileName}`;

    const profile = await InternProfile.create({
      user: user._id,
      summary: buildSeedSummary(profileSeed),
      ...profileSeed,
      resume: {
        filePath: resumeFilePath,
        text: resumeText,
        score: 0
      }
    });

    const result = await computeResumeScore({ profile, resumeText });
    profile.resume.score = result.resumeScore;
    profile.resume.scoreSource = result.scoreSource;
    profile.resume.predictedCategory = result.predictedCategory || "";
    profile.resume.confidence = typeof result.confidence === "number" ? result.confidence : null;
    profile.resume.analysis = result.analysis || null;
    await profile.save();

    internProfilesByEmail[profile.email] = profile;
  }

  const companiesByEmail = {};
  for (const companySeed of seedData.companyProfiles) {
    const user = usersByEmail[companySeed.companyEmail];
    const company = await CompanyProfile.create({
      user: user._id,
      ...companySeed
    });
    companiesByEmail[company.companyEmail] = company;
  }

  for (const userSeed of seedData.users) {
    if (!userSeed.linkedCompanyEmail) continue;
    const user = usersByEmail[userSeed.email];
    const company = companiesByEmail[userSeed.linkedCompanyEmail];
    if (!user || !company) continue;
    user.companyProfileRef = company._id;
    await user.save();
  }

  const internshipsByRole = {};
  for (const internshipSeed of seedData.internships) {
    const company = companiesByEmail[internshipSeed.companyEmail];
    const hrUser = internshipSeed.assignToHrEmail ? usersByEmail[internshipSeed.assignToHrEmail] : null;
    const { assignToHrEmail, companyEmail, ...internshipFields } = internshipSeed;
    const internship = await Internship.create({
      ...internshipFields,
      company: company._id,
      assignedRecruiter: hrUser?._id || null,
      assignedDepartment: internshipFields.department || ""
    });
    internshipsByRole[internship.role] = internship;
  }

  for (const applicationSeed of seedData.applications) {
    const intern = internProfilesByEmail[applicationSeed.internEmail];
    const internship = internshipsByRole[applicationSeed.internshipRole];
    const hrUser = applicationSeed.assignToHrEmail ? usersByEmail[applicationSeed.assignToHrEmail] : null;

    await Application.create({
      internId: intern._id,
      internshipId: internship._id,
      companyId: internship.company,
      intern: intern._id,
      internship: internship._id,
      company: internship.company,
      assignedRecruiter: hrUser?._id || internship.assignedRecruiter || null,
      status: applicationSeed.status,
      appliedAt: new Date(),
      attachedResumePath: intern.resume?.filePath || SEED_RESUME_PATH,
      availabilityStatus: applicationSeed.availabilityStatus || "yes",
      relevanceScore: applicationSeed.matchScore,
      matchScore: applicationSeed.matchScore,
      hrFeedback: applicationSeed.hrFeedback,
      stageHistory: [
        { stage: "applied", note: "Seeded application" },
        { stage: applicationSeed.status, note: "Seeded status" }
      ]
    });
  }

  return { seeded: true, reason: reset ? "reset-seed" : "empty-database" };
}

module.exports = { seedDatabase, resetCollections };
