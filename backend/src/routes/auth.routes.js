const express = require("express");
const authController = require("../controllers/auth.controller");
const authMiddleware = require("../middleware/auth.middleware");

const router = express.Router();

router.post("/intern/send-otp", authController.sendInternOtp);
router.post("/intern/verify-otp", authController.verifyInternOtp);
router.post("/intern/signup", authController.internSignup);
router.post("/company/signup", authController.companySignup);

router.post("/intern/login", authController.internLogin);
router.post("/company/login", authController.companyLogin);
router.post("/admin/login", authController.adminLogin);

router.get("/me", authMiddleware, authController.getMe);

module.exports = router;
