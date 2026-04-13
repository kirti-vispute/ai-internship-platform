const express = require("express");
const internController = require("../controllers/intern.controller");
const authMiddleware = require("../middleware/auth.middleware");
const allowRoles = require("../middleware/role.middleware");
const upload = require("../middleware/upload.middleware");

const router = express.Router();

router.use(authMiddleware, allowRoles("intern"));

router.get("/profile", internController.getProfile);
router.put("/profile", internController.updateProfile);
router.post("/resume/upload", upload.single("resume"), internController.uploadResume);
router.get("/resume/score", internController.getResumeScore);
router.post("/skill-gap", internController.getSkillGap);
router.get("/internships", internController.getActiveInternships);
router.get("/recommendations", internController.getRecommendations);
router.post("/apply/:internshipId", internController.applyToInternship);
router.get("/applications", internController.getMyApplications);
router.get("/saved-internships", internController.getSavedInternships);
router.post("/saved-internships/:internshipId", internController.saveInternship);
router.delete("/saved-internships/:internshipId", internController.unsaveInternship);
router.get("/feedback", internController.getMyFeedback);
router.post("/report-company", internController.reportCompany);

module.exports = router;
