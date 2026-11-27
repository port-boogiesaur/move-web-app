const express = require("express");
const authenticateToken = require("../middleware/auth.middleware");
const {
  getFriends,
  getRequests,
  searchUsers,
  createFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
  cancelFriendRequest,
  removeFriend,
} = require("../controllers/friends.controller");

const router = express.Router();

router.use(authenticateToken);

router.get("/", getFriends);
router.get("/requests", getRequests);
router.get("/search", searchUsers);
router.post("/request", createFriendRequest);
router.patch("/requests/:id/accept", acceptFriendRequest);
router.patch("/requests/:id/decline", declineFriendRequest);
router.delete("/requests/:id", cancelFriendRequest);
router.delete("/:userId", removeFriend);

module.exports = router;
