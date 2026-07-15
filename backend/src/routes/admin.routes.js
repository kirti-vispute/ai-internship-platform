const express = require("express");
const adminController = require("../controllers/admin.controller");
const hiringScoringController = require("../controllers/hiring-scoring.controller");
const certificationController = require("../controllers/certification.controller");
const reportController = require("../controllers/report.controller");
const authMiddleware = require("../middleware/auth.middleware");
const allowRoles = require("../middleware/role.middleware");
const allowPermissions = require("../middleware/permission.middleware");

const router = express.Router();

router.use(authMiddleware, allowRoles("admin"));

router.get("/metrics", adminController.getDashboardMetrics);
router.get("/users", allowPermissions("admin:user:view"), adminController.getAllUsers);
router.get("/users/:userId", allowPermissions("admin:user:view"), adminController.getUserById);
router.patch("/users/:userId", allowPermissions("admin:user:update"), adminController.updateUser);
router.delete("/users/:userId", allowPermissions("admin:user:soft-delete"), adminController.softDeleteUser);

router.get("/internships", adminController.getAllInternships);
router.patch("/internships/:internshipId/moderation", allowPermissions("admin:report:review"), adminController.moderateInternship);
router.get("/companies", allowPermissions("admin:company:verify"), adminController.getCompanies);
router.patch("/companies/:companyId/verification", allowPermissions("admin:company:verify"), adminController.updateCompanyVerification);

router.post("/reports", adminController.reportCompany);
router.get("/reports", allowPermissions("admin:report:review"), adminController.getReportedCompanies);
router.patch("/reports/:reportId/resolve", allowPermissions("admin:report:review"), adminController.resolveReport);
router.get("/activity-logs", allowPermissions("admin:activity:view"), adminController.getActivityLogs);

router.get("/certifications", allowPermissions("admin:certification:review"), certificationController.listCertificationsAdmin);
router.patch(
  "/certifications/:certificationId/review",
  allowPermissions("admin:certification:review"),
  certificationController.reviewCertificationAdmin
);
router.get(
  "/certifications/:certificationId/file",
  allowPermissions("admin:certification:review"),
  certificationController.downloadCertificateAdmin
);

router.get("/reports/platform-statistics", reportController.downloadAdminPlatformStatistics);
router.get("/reports/verification/:companyId", allowPermissions("admin:company:verify"), reportController.downloadAdminVerificationReport);

router.get("/hiring-scoring/templates", allowPermissions("admin:manage"), hiringScoringController.listTemplates);
router.post("/hiring-scoring/templates", allowPermissions("admin:manage"), hiringScoringController.saveTemplate);
router.put("/hiring-scoring/templates", allowPermissions("admin:manage"), hiringScoringController.saveTemplate);
router.post("/hiring-scoring/preview", allowPermissions("admin:manage"), hiringScoringController.previewTemplate);

module.exports = router;
