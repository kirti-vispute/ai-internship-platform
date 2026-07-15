const express = require("express");
const internController = require("../controllers/intern.controller");
const notificationController = require("../controllers/notification.controller");
const reportController = require("../controllers/report.controller");
const authMiddleware = require("../middleware/auth.middleware");
const allowRoles = require("../middleware/role.middleware");
const upload = require("../middleware/upload.middleware");
const certificateUpload = require("../middleware/certificate-upload.middleware");
const certificationController = require("../controllers/certification.controller");

const router = express.Router();

router.use(authMiddleware, allowRoles("intern"));

router.get("/profile", internController.getProfile);
router.put("/profile", internController.updateProfile);
router.post("/resume/upload", upload.single("resume"), internController.uploadResume);
router.get("/resume/score", internController.getResumeScore);
router.post("/skill-gap", internController.getSkillGap);
router.post("/roadmap", internController.getCareerRoadmap);
router.get("/internships", internController.getActiveInternships);
router.get("/recommendations", internController.getRecommendations);
router.post("/apply/:internshipId", internController.applyToInternship);
router.get("/applications", internController.getMyApplications);
router.get("/interviews", internController.getMyInterviews);
router.post("/interviews/reminders/check", internController.checkInterviewReminders);
router.get("/saved-internships", internController.getSavedInternships);
router.post("/saved-internships/:internshipId", internController.saveInternship);
router.delete("/saved-internships/:internshipId", internController.unsaveInternship);
router.get("/feedback", internController.getMyFeedback);
router.get("/notifications", notificationController.listNotifications);
router.patch("/notifications/read-all", notificationController.markAllNotificationsRead);
router.patch("/notifications/:notificationId/read", notificationController.markNotificationRead);
router.patch("/applications/:applicationId/withdraw", internController.withdrawApplication);
router.post("/report-company", internController.reportCompany);

router.get("/certifications", certificationController.listMyCertifications);
router.post(
  "/certifications",
  certificateUpload.single("certificateFile"),
  certificationController.submitCertification
);
router.get("/certifications/:certificationId/file", certificationController.downloadMyCertificate);
router.get("/certifications/:certificationId", certificationController.getMyCertification);

router.get("/reports/resume-analysis", reportController.downloadInternResumeAnalysis);
router.get("/reports/skill-gap", reportController.downloadInternSkillGap);
router.get("/reports/application-history", reportController.downloadInternApplicationHistory);

module.exports = router;
