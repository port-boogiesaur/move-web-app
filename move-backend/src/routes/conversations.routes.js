const express = require("express");
const authenticateToken = require("../middleware/auth.middleware");
const {
  getConversations,
  startConversation,
  getMessages,
  sendMessage,
  markMessagesRead,
} = require("../controllers/conversations.controller");

const router = express.Router();

router.use(authenticateToken);

router.get("/", getConversations);
router.post("/", startConversation);
router.get("/:conversationId/messages", getMessages);
router.post("/:conversationId/messages", sendMessage);
router.patch("/:conversationId/read", markMessagesRead);

module.exports = router;
