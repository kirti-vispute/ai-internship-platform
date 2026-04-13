require("dotenv").config();

const connectDB = require("./config/db");
const User = require("./models/User");
const InternProfile = require("./models/InternProfile");
const CompanyProfile = require("./models/CompanyProfile");
const Internship = require("./models/Internship");
const Application = require("./models/Application");
const ReportedCompany = require("./models/ReportedCompany");
const { hashPassword } = require("./utils/password");
const seedData = require("./data/seedData");
const { calculateResumeScore } = require("./services/ai.service");

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

async function runSeed() {
  await connectDB();
  await resetCollections();

  const usersByEmail = {};
  for (const userSeed of seedData.users) {
    const user = await User.create({
      email: userSeed.email,
      role: userSeed.role,
      passwordHash: await hashPassword(userSeed.password)
    });
    usersByEmail[user.email] = user;
  }

  const internProfilesByEmail = {};
  for (const profileSeed of seedData.internProfiles) {
    const user = usersByEmail[profileSeed.email];
    const profile = await InternProfile.create({
      user: user._id,
      ...profileSeed,
      resume: { filePath: "", text: "", score: 0 }
    });

    profile.resume.score = calculateResumeScore(profile);
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

  const internshipsByRole = {};
  for (const internshipSeed of seedData.internships) {
    const company = companiesByEmail[internshipSeed.companyEmail];
    const internship = await Internship.create({
      ...internshipSeed,
      company: company._id
    });
    internshipsByRole[internship.role] = internship;
  }

  for (const applicationSeed of seedData.applications) {
    const intern = internProfilesByEmail[applicationSeed.internEmail];
    const internship = internshipsByRole[applicationSeed.internshipRole];

    await Application.create({
      internId: intern._id,
      internshipId: internship._id,
      companyId: internship.company,
      intern: intern._id,
      internship: internship._id,
      company: internship.company,
      status: applicationSeed.status,
      appliedAt: new Date(),
      relevanceScore: applicationSeed.matchScore,
      matchScore: applicationSeed.matchScore,
      hrFeedback: applicationSeed.hrFeedback,
      stageHistory: [{ stage: "applied", note: "Seeded application" }, { stage: applicationSeed.status, note: "Seeded status" }]
    });
  }

  // eslint-disable-next-line no-console
  console.log("Seed completed successfully.");
  process.exit(0);
}

runSeed().catch((error) => {
  // eslint-disable-next-line no-console
  console.error("Seed failed", error);
  process.exit(1);
});
