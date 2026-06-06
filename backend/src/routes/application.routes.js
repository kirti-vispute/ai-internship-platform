const express = require("express");
const applicationController = require("../controllers/application.controller");
const authMiddleware = require("../middleware/auth.middleware");

const router = express.Router();

router.use(authMiddleware);
router.get("/:id", applicationController.getApplicationById);
router.get("/:id/resume", applicationController.getApplicationResume);

module.exports = router;
