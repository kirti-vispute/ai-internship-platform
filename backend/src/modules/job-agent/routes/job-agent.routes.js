const express = require("express");
const authMiddleware = require("../../../shared/middleware/auth.middleware");
const allowRoles = require("../../../shared/middleware/role.middleware");
const validateObjectId = require("../../../shared/middleware/validate-object-id.middleware");
const { isEnabled } = require("../../../shared/config/feature-flags");
const AppError = require("../../../shared/utils/AppError");
const controller = require("../controllers/job-agent.controller");

const router = express.Router();

// Every AI Job Agent endpoint is intern-only and scoped to req.user._id --
// no endpoint here ever accepts another user's id from the request body or
// query string, so there is no cross-user data path to authorize against.
router.use(authMiddleware, allowRoles("intern"));

// Mirrors the ENABLE_INTERVIEW_ROOMS convention (interview.controller.js's
// ensureInterviewRoomsEnabled): a disabled feature flag must actually shut
// off the API, not just hide the sidebar link and stop the scheduler --
// otherwise ENABLE_JOB_AGENT=false still leaves every endpoint reachable.
// Exported (unusually, off the router function) purely so this guard is
// unit-testable without spinning up Express/supertest.
function ensureJobAgentEnabled() {
  if (!isEnabled("ENABLE_JOB_AGENT")) {
    throw new AppError("The AI Job Agent is currently disabled.", 503, null, { code: "JOB_AGENT_DISABLED" });
  }
}

router.use((req, res, next) => {
  try {
    ensureJobAgentEnabled();
    return next();
  } catch (error) {
    return next(error);
  }
});

router.get("/preferences", controller.getPreferences);
router.put("/preferences", controller.upsertPreferences);
router.post("/pause", controller.pauseAgent);
router.post("/resume", controller.resumeAgent);
router.get("/status", controller.getStatus);
router.get("/feed", controller.getFeed);
router.get("/providers", controller.getProviderHealth);

router.get("/applications", controller.listApplications);
router.post("/applications", controller.trackJob);
router.patch("/applications/:id", validateObjectId("id"), controller.updateApplication);
router.delete("/applications/:id", validateObjectId("id"), controller.deleteApplication);
router.post("/applications/:id/materials", validateObjectId("id"), controller.generateMaterials);
router.patch("/applications/:id/materials", validateObjectId("id"), controller.updateMaterials);

module.exports = router;
module.exports.ensureJobAgentEnabled = ensureJobAgentEnabled;
