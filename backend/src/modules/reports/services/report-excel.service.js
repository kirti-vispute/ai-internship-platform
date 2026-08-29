const ExcelJS = require("exceljs");
const Application = require("../../../models/Application");
const Internship = require("../../../models/Internship");
const User = require("../../../models/User");
const InternProfile = require("../../../models/InternProfile");
const { BRAND_NAME } = require("../../../shared/constants/brand");

const HEADER_FILL = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1F6FFF" } };
const HEADER_FONT = { bold: true, color: { argb: "FFFFFFFF" } };

function newWorkbook() {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = BRAND_NAME;
  workbook.created = new Date();
  return workbook;
}

function addSheet(workbook, name, columns) {
  const sheet = workbook.addWorksheet(name);
  sheet.columns = columns;
  sheet.getRow(1).eachCell((cell) => {
    cell.fill = HEADER_FILL;
    cell.font = HEADER_FONT;
  });
  sheet.views = [{ state: "frozen", ySplit: 1 }];
  sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: columns.length } };
  return sheet;
}

async function toBuffer(workbook) {
  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}

async function buildCandidatesWorkbook() {
  const workbook = newWorkbook();
  const applications = await Application.find({})
    .populate({ path: "intern", select: "fullName email mobile skills" })
    .populate({ path: "internship", select: "role location stipend" })
    .populate({ path: "company", select: "companyName" })
    .sort({ createdAt: -1 })
    .lean();

  const sheet = addSheet(workbook, "Internship Candidates", [
    { header: "Candidate Name", key: "name", width: 26 },
    { header: "Candidate Email", key: "email", width: 30 },
    { header: "Mobile", key: "mobile", width: 16 },
    { header: "Skills", key: "skills", width: 36 },
    { header: "Applied For (Role)", key: "role", width: 30 },
    { header: "Company", key: "company", width: 24 },
    { header: "Location", key: "location", width: 22 },
    { header: "Stipend", key: "stipend", width: 18 },
    { header: "Status", key: "status", width: 18 },
    { header: "Match Score", key: "matchScore", width: 14 },
    { header: "Applied On", key: "appliedAt", width: 18 },
    { header: "Resume Path", key: "resume", width: 34 }
  ]);

  for (const application of applications) {
    sheet.addRow({
      name: application.intern?.fullName || "",
      email: application.intern?.email || "",
      mobile: application.intern?.mobile || "",
      skills: (application.intern?.skills || []).join(", "),
      role: application.internship?.role || "",
      company: application.company?.companyName || "",
      location: application.internship?.location || "",
      stipend: application.internship?.stipend || "",
      status: application.status || "",
      matchScore: application.matchScore || 0,
      appliedAt: application.appliedAt ? new Date(application.appliedAt).toISOString().slice(0, 10) : "",
      resume: application.attachedResumePath || ""
    });
  }

  return toBuffer(workbook);
}

async function buildInternshipsWorkbook() {
  const workbook = newWorkbook();
  const internships = await Internship.find({ isDeleted: false })
    .populate({ path: "company", select: "companyName verificationStatus" })
    .sort({ createdAt: -1 })
    .lean();

  const sheet = addSheet(workbook, "Internships", [
    { header: "Role", key: "role", width: 32 },
    { header: "Company", key: "company", width: 26 },
    { header: "Verification Status", key: "verification", width: 18 },
    { header: "Location", key: "location", width: 24 },
    { header: "Mode", key: "mode", width: 12 },
    { header: "Stipend", key: "stipend", width: 20 },
    { header: "Duration", key: "duration", width: 18 },
    { header: "Skills Required", key: "skills", width: 40 },
    { header: "Openings", key: "openings", width: 12 },
    { header: "Active", key: "active", width: 10 },
    { header: "Posted On", key: "createdAt", width: 18 }
  ]);

  for (const internship of internships) {
    sheet.addRow({
      role: internship.role || "",
      company: internship.company?.companyName || "",
      verification: internship.company?.verificationStatus || "",
      location: internship.location || "",
      mode: internship.mode || "",
      stipend: internship.stipend || "",
      duration: internship.duration || "",
      skills: (internship.skillsRequired || []).join(", "),
      openings: internship.openings ?? "",
      active: internship.isActive ? "Yes" : "No",
      createdAt: internship.createdAt ? new Date(internship.createdAt).toISOString().slice(0, 10) : ""
    });
  }

  return toBuffer(workbook);
}

const USER_EXPORT_LABELS = {
  intern: "Intern Users",
  hr: "HR Users",
  ceo: "CEO Users"
};

async function buildUsersWorkbook({ role, companyAccountType } = {}) {
  const workbook = newWorkbook();
  const filter = { role };
  if (companyAccountType) filter.companyAccountType = companyAccountType;

  const users = await User.find(filter).sort({ createdAt: -1 }).lean();

  const sheetName = USER_EXPORT_LABELS[companyAccountType || role] || "Users";

  if (role === "intern") {
    const userIds = users.map((user) => user._id);
    const profiles = await InternProfile.find({ user: { $in: userIds } }).lean();
    const profileByUserId = new Map(profiles.map((profile) => [String(profile.user), profile]));

    const sheet = addSheet(workbook, sheetName, [
      { header: "Full Name", key: "name", width: 26 },
      { header: "Email", key: "email", width: 30 },
      { header: "Mobile", key: "mobile", width: 16 },
      { header: "Skills", key: "skills", width: 36 },
      { header: "Education", key: "education", width: 36 },
      { header: "Resume Score", key: "resumeScore", width: 14 },
      { header: "Account Active", key: "active", width: 14 },
      { header: "Joined On", key: "createdAt", width: 18 }
    ]);

    for (const user of users) {
      const profile = profileByUserId.get(String(user._id));
      sheet.addRow({
        name: profile?.fullName || "",
        email: user.email || "",
        mobile: profile?.mobile || "",
        skills: (profile?.skills || []).join(", "),
        education: (profile?.education || []).join("; "),
        resumeScore: profile?.resume?.score ?? "",
        active: user.isActive ? "Yes" : "No",
        createdAt: user.createdAt ? new Date(user.createdAt).toISOString().slice(0, 10) : ""
      });
    }

    return toBuffer(workbook);
  }

  const sheet = addSheet(workbook, sheetName, [
    { header: "Email", key: "email", width: 32 },
    { header: "Display Name", key: "displayName", width: 24 },
    { header: "Account Type", key: "accountType", width: 16 },
    { header: "Account Active", key: "active", width: 14 },
    { header: "Joined On", key: "createdAt", width: 18 }
  ]);

  for (const user of users) {
    sheet.addRow({
      email: user.email || "",
      displayName: user.displayName || "",
      accountType: user.companyAccountType || "",
      active: user.isActive ? "Yes" : "No",
      createdAt: user.createdAt ? new Date(user.createdAt).toISOString().slice(0, 10) : ""
    });
  }

  return toBuffer(workbook);
}

module.exports = { buildCandidatesWorkbook, buildInternshipsWorkbook, buildUsersWorkbook };
