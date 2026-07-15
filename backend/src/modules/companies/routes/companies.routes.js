const express = require("express");
const companyPublicController = require("../../../controllers/company-public.controller");

const router = express.Router();

router.get("/:companyId/public", companyPublicController.getPublicCompanyProfile);

module.exports = router;
