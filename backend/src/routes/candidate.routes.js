const express = require("express");
const candidateController = require("../controllers/candidate.controller");
const authMiddleware = require("../middleware/auth.middleware");
const allowRoles = require("../middleware/role.middleware");

const router = express.Router();

router.use(authMiddleware, allowRoles("company", "admin"));

router.get("/search", candidateController.searchCandidates);

module.exports = router;
