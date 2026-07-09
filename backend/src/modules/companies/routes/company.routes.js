const express = require("express");
const companyController = require("../../../controllers/company.controller");
const notificationController = require("../../../controllers/notification.controller");
const reportController = require("../../../controllers/report.controller");
const companyHrController = require("../../../controllers/company-hr.controller");
const portfolioController = require("../../../controllers/portfolio.controller");
const hiringScoringController = require("../../../controllers/hiring-scoring.controller");
const authMiddleware = require("../../../shared/middleware/auth.middleware");
const allowRoles = require("../../../shared/middleware/role.middleware");
const {
  requireCanPostInternship,
  requireCanUpdateCompanyProfile,
  requireCeoHrManagement,
  requireAssignRecruiters,
  requireSidebarModule,
  requireViewRecruiters
} = require("../../../shared/middleware/company-access.middleware");
const { SIDEBAR_MODULE_KEYS } = require("../../../constants/sidebar-modules");

const router = express.Router();

router.use(authMiddleware, allowRoles("company"));

router.get("/profile", companyController.getProfile);
router.put("/profile", requireCanUpdateCompanyProfile(), companyController.updateProfile);

router.post("/internships", requireCanPostInternship(), companyController.postInternship);
router.get("/internships", companyController.getMyInternships);
router.patch("/internships/:id", companyController.updateMyInternship);
router.delete("/internships/:id", companyController.deleteMyInternship);
router.post(
  "/internships/:id/assign-recruiter",
  requireAssignRecruiters(),
  companyController.assignInternshipRecruiter
);

router.get("/internships/:id/applicants", companyController.getApplicantsForInternship);
router.get(
  "/internships/:id/matched-candidates",
  requireSidebarModule(SIDEBAR_MODULE_KEYS.AI_INSIGHTS),
  companyController.getAiMatchedCandidates
);
router.get("/applications", companyController.getAllApplications);
router.get("/interns/:internProfileId/portfolio", portfolioController.getInternPortfolioSummary);

router.patch("/applications/:applicationId/stage", companyController.updateCandidateStage);
router.post(
  "/applications/:applicationId/assign-recruiter",
  requireAssignRecruiters(),
  companyController.assignApplicationRecruiter
);
router.post("/applications/:applicationId/feedback", companyController.addHrFeedback);
router.post("/applications/:applicationId/interviews", companyController.scheduleInterviewRound);
router.patch("/applications/:applicationId/interviews/:roundId", companyController.updateInterviewRound);

router.get("/hr/insights", requireCeoHrManagement(), companyHrController.getHrInsights);
router.post("/hr/create", requireCeoHrManagement(), companyHrController.createHr);
router.delete("/hr/:id", requireCeoHrManagement(), companyHrController.deleteHr);
router.patch("/hr/:id/permissions", requireCeoHrManagement(), companyHrController.patchHrPermissions);

router.get("/recruiters", requireViewRecruiters(), companyController.getRecruiters);
router.post("/recruiters", requireCeoHrManagement(), companyHrController.createHr);
router.delete("/recruiters/:userId", requireCeoHrManagement(), companyHrController.deleteHr);
router.get("/analytics", requireSidebarModule(SIDEBAR_MODULE_KEYS.ANALYTICS), companyController.getCompanyAnalytics);
router.get("/hiring-scoring/templates", hiringScoringController.listTemplates);

router.get("/notifications", notificationController.listNotifications);
router.patch("/notifications/read-all", notificationController.markAllNotificationsRead);
router.patch("/notifications/:notificationId/read", notificationController.markNotificationRead);

router.get(
  "/reports/hiring",
  requireSidebarModule(SIDEBAR_MODULE_KEYS.HIRING_REPORTS),
  reportController.downloadCompanyHiringReport
);
router.get(
  "/reports/candidate-evaluation/:applicationId",
  requireSidebarModule(SIDEBAR_MODULE_KEYS.HIRING_REPORTS),
  reportController.downloadCompanyCandidateEvaluation
);
router.get(
  "/reports/interview/:applicationId",
  requireSidebarModule(SIDEBAR_MODULE_KEYS.HIRING_REPORTS),
  reportController.downloadCompanyInterviewReport
);

module.exports = router;
