const express = require("express");
const calendarController = require("../../../controllers/calendar.controller");
const authMiddleware = require("../../../shared/middleware/auth.middleware");

const router = express.Router();

router.use(authMiddleware);

router.get("/entries", calendarController.listEntries);
router.post("/entries", calendarController.createEntry);
router.patch("/entries/:entryId", calendarController.updateEntry);
router.delete("/entries/:entryId", calendarController.deleteEntry);

module.exports = router;
