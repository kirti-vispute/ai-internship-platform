const express = require("express");
const internshipController = require("../controllers/internship.controller");

const router = express.Router();

router.get("/", internshipController.getAllInternships);
router.get("/:id", internshipController.getInternshipById);

module.exports = router;
