const express = require("express");
const companyController = require("../controllers/company.controller");
const authMiddleware = require("../middleware/auth.middleware");
const allowRoles = require("../middleware/role.middleware");

const router = express.Router();

router.use(authMiddleware, allowRoles("company"));

router.get("/profile", companyController.getProfile);
router.put("/profile", companyController.updateProfile);

router.post("/internships", companyController.postInternship);
router.get("/internships", companyController.getMyInternships);
router.patch("/internships/:id", companyController.updateMyInternship);
router.delete("/internships/:id", companyController.deleteMyInternship);

router.get("/internships/:id/applicants", companyController.getApplicantsForInternship);
router.get("/internships/:id/matched-candidates", companyController.getAiMatchedCandidates);

router.patch("/applications/:applicationId/stage", companyController.updateCandidateStage);
router.post("/applications/:applicationId/feedback", companyController.addHrFeedback);
router.post("/applications/:applicationId/interviews", companyController.scheduleInterviewRound);
router.patch("/applications/:applicationId/interviews/:roundId", companyController.updateInterviewRound);

module.exports = router;
