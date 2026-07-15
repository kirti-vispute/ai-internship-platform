const express = require("express");
const chatController = require("../../../controllers/chat.controller");
const authMiddleware = require("../../../shared/middleware/auth.middleware");
const allowRoles = require("../../../shared/middleware/role.middleware");

const router = express.Router();

router.use(authMiddleware, allowRoles("intern", "company"));

router.get("/unread-count", chatController.getUnreadCount);
router.get("/recent", chatController.getRecentConversations);
router.get("/contacts", chatController.listEligibleContacts);
router.get("/conversations", chatController.listConversations);
router.post("/conversations", chatController.createOrGetConversation);
router.get("/conversations/:conversationId/messages", chatController.getMessages);
router.post("/conversations/:conversationId/messages", chatController.postMessage);
router.patch("/conversations/:conversationId/read", chatController.markRead);

module.exports = router;
