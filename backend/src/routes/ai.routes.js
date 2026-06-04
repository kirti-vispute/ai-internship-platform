const express = require("express");
const aiController = require("../controllers/ai.controller");
const authMiddleware = require("../middleware/auth.middleware");
const allowRoles = require("../middleware/role.middleware");

const router = express.Router();

router.post("/parse-resume", authMiddleware, aiController.parseResume);
router.post("/resume-score", authMiddleware, aiController.computeResumeScore);
router.post("/skill-gap", authMiddleware, aiController.computeSkillGap);
router.post("/roadmap", authMiddleware, aiController.generateRoadmap);
router.post("/recommendations", authMiddleware, aiController.recommend);
router.post("/match-candidates", authMiddleware, allowRoles("company", "admin"), aiController.matchCandidates);

module.exports = router;
