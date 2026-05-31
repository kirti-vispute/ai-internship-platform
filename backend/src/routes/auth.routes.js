const express = require("express");
const authController = require("../controllers/auth.controller");
const authMiddleware = require("../middleware/auth.middleware");
const validate = require("../middleware/validate.middleware");
const { requireEmail, requireInternSignup } = require("../validators/auth.validator");

const router = express.Router();

router.post("/intern/send-otp", validate(requireEmail), authController.sendInternOtp);
router.post("/intern/verify-otp", authController.verifyInternOtp);
router.post("/intern/signup", validate(requireInternSignup), authController.internSignup);
router.post("/password/send-otp", validate(requireEmail), authController.sendPasswordResetOtp);
router.post("/password/reset", authController.resetPasswordWithOtp);
router.post("/company/signup", authController.companySignup);
router.post("/admin/send-otp", validate(requireEmail), authController.sendAdminLoginOtp);

router.post("/intern/login", authController.internLogin);
router.post("/company/login", authController.companyLogin);
router.post("/admin/login", authController.adminLogin);
router.post("/refresh", authController.refreshSession);
router.post("/logout", authController.logout);

router.get("/me", authMiddleware, authController.getMe);

module.exports = router;
