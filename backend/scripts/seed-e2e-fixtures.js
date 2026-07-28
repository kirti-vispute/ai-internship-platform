// One-off, idempotent script that creates two dedicated, clearly-labeled
// accounts for Playwright E2E tests to log into. Additive only — never
// touches any existing user/profile in this shared dev database.
require("dotenv").config();
const mongoose = require("mongoose");

const E2E_INTERN_EMAIL = "e2e.intern@internai-test.local";
const E2E_INTERN_PASSWORD = "E2eIntern@123";
const E2E_COMPANY_OWNER_EMAIL = "e2e.company.owner@internai-test.local";
const E2E_COMPANY_OWNER_PASSWORD = "E2eCompanyOwner@123";
const E2E_COMPANY_HR_EMAIL = "e2e.company.hr@internai-test.local";
const E2E_COMPANY_HR_PASSWORD = "E2eCompanyHr@123";
const E2E_COMPANY_CEO_EMAIL = "e2e.company.ceo@internai-test.local";
const E2E_COMPANY_CEO_PASSWORD = "E2eCompanyCeo@123";

// A ceo@novatech.example account exists in seedData.js, but every account
// there except admin@internai.com only survives until someone runs
// `npm run seed` (destructive: seedDatabase({reset:true}) wipes Users/
// Profiles/Internships/Applications first) -- not safe for E2E to depend
// on. Keep CEO/admin-sub-role fixtures here, additive, same as owner/HR.
const E2E_ADMIN_SUB_ROLES = [
  { email: "e2e.admin.verification@internai-test.local", password: "E2eAdminVerification@123", adminRole: "verification_admin" },
  { email: "e2e.admin.moderation@internai-test.local", password: "E2eAdminModeration@123", adminRole: "moderation_admin" },
  { email: "e2e.admin.support@internai-test.local", password: "E2eAdminSupport@123", adminRole: "support_admin" }
];

async function main() {
  await mongoose.connect(process.env.MONGO_URI);

  const User = require("../src/modules/authentication/models/User");
  const InternProfile = require("../src/modules/students/models/InternProfile");
  const CompanyProfile = require("../src/modules/companies/models/CompanyProfile");
  const { hashPassword } = require("../src/shared/utils/password");

  let internUser = await User.findOne({ email: E2E_INTERN_EMAIL });
  if (!internUser) {
    internUser = await User.create({
      email: E2E_INTERN_EMAIL,
      passwordHash: await hashPassword(E2E_INTERN_PASSWORD),
      role: "intern",
      emailVerified: true
    });
    await InternProfile.create({
      user: internUser._id,
      fullName: "E2E Test Intern",
      email: E2E_INTERN_EMAIL,
      mobile: "9999900001",
      skills: ["React", "Node.js"],
      education: [],
      projects: [],
      certifications: [],
      interests: [],
      completedCourses: []
    });
    console.log("Created E2E intern fixture:", E2E_INTERN_EMAIL);
  } else {
    console.log("E2E intern fixture already exists:", E2E_INTERN_EMAIL);
  }

  let ownerUser = await User.findOne({ email: E2E_COMPANY_OWNER_EMAIL });
  let companyProfile;
  if (!ownerUser) {
    ownerUser = await User.create({
      email: E2E_COMPANY_OWNER_EMAIL,
      passwordHash: await hashPassword(E2E_COMPANY_OWNER_PASSWORD),
      role: "company",
      companyAccountType: "owner",
      emailVerified: true
    });
    companyProfile = await CompanyProfile.create({
      user: ownerUser._id,
      companyName: "E2E Test Company",
      companyEmail: E2E_COMPANY_OWNER_EMAIL,
      gst: "27AAAAA0000A1Z5",
      contactName: "E2E Test Contact",
      phone: "9999900002",
      address: "Test Address",
      description: "Dedicated fixture account for automated E2E tests.",
      verificationStatus: "verified"
    });
    ownerUser.companyProfileRef = companyProfile._id;
    await ownerUser.save();
    console.log("Created E2E company owner fixture:", E2E_COMPANY_OWNER_EMAIL);
  } else {
    companyProfile = await CompanyProfile.findById(ownerUser.companyProfileRef);
    console.log("E2E company owner fixture already exists:", E2E_COMPANY_OWNER_EMAIL);
  }

  // A real HR account: same companyProfileRef as the owner, but its own User
  // with companyAccountType "hr" — matches how the app actually models HR
  // sub-accounts (auth.middleware.js derives HR's restricted permission set
  // from this field, not from the profile itself).
  let hrUser = await User.findOne({ email: E2E_COMPANY_HR_EMAIL });
  if (!hrUser) {
    hrUser = await User.create({
      email: E2E_COMPANY_HR_EMAIL,
      passwordHash: await hashPassword(E2E_COMPANY_HR_PASSWORD),
      role: "company",
      companyAccountType: "hr",
      companyProfileRef: companyProfile._id,
      emailVerified: true
    });
    console.log("Created E2E company HR fixture:", E2E_COMPANY_HR_EMAIL);
  } else {
    console.log("E2E company HR fixture already exists:", E2E_COMPANY_HR_EMAIL);
  }

  // A real CEO account: same companyProfileRef as owner/HR, its own User
  // with companyAccountType "ceo" -- executive tier, same as owner.
  let ceoUser = await User.findOne({ email: E2E_COMPANY_CEO_EMAIL });
  if (!ceoUser) {
    ceoUser = await User.create({
      email: E2E_COMPANY_CEO_EMAIL,
      passwordHash: await hashPassword(E2E_COMPANY_CEO_PASSWORD),
      role: "company",
      companyAccountType: "ceo",
      companyProfileRef: companyProfile._id,
      emailVerified: true
    });
    console.log("Created E2E company CEO fixture:", E2E_COMPANY_CEO_EMAIL);
  } else {
    console.log("E2E company CEO fixture already exists:", E2E_COMPANY_CEO_EMAIL);
  }

  // Admin sub-role fixtures. No dedicated "create admin with sub-role"
  // endpoint exists (only PATCH /api/admin/users/:userId from a super_admin
  // session) -- direct creation matches how admin@internai.com itself is
  // made in seedData.js. User's pre('save') hook derives `permissions` from
  // `adminRole` automatically.
  for (const spec of E2E_ADMIN_SUB_ROLES) {
    const existing = await User.findOne({ email: spec.email });
    if (!existing) {
      await User.create({
        email: spec.email,
        passwordHash: await hashPassword(spec.password),
        role: "admin",
        adminRole: spec.adminRole,
        emailVerified: true
      });
      console.log("Created E2E admin fixture:", spec.email, spec.adminRole);
    } else {
      console.log("E2E admin fixture already exists:", spec.email, spec.adminRole);
    }
  }

  await mongoose.connection.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
