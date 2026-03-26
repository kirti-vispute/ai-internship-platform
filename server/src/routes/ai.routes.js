const express = require("express");
const aiController = require("../controllers/ai.controller");
const authMiddleware = require("../middleware/auth.middleware");

const router = express.Router();

router.post("/parse-resume", authMiddleware, aiController.parseResume);
router.post("/resume-score", authMiddleware, aiController.computeResumeScore);
router.post("/skill-gap", authMiddleware, aiController.computeSkillGap);
router.post("/recommendations", authMiddleware, aiController.recommend);
router.post("/match-candidates", authMiddleware, aiController.matchCandidates);

module.exports = router;
