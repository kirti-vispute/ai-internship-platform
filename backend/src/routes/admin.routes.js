const express = require("express");
const adminController = require("../controllers/admin.controller");
const authMiddleware = require("../middleware/auth.middleware");
const allowRoles = require("../middleware/role.middleware");

const router = express.Router();

router.use(authMiddleware, allowRoles("admin"));

router.get("/users", adminController.getAllUsers);
router.get("/internships", adminController.getAllInternships);
router.get("/companies", adminController.getCompanies);
router.patch("/companies/:companyId/verification", adminController.updateCompanyVerification);

router.post("/reports", adminController.reportCompany);
router.get("/reports", adminController.getReportedCompanies);
router.patch("/reports/:reportId/resolve", adminController.resolveReport);

module.exports = router;
