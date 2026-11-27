const express = require("express");

const {
  getActivityTypes,
} = require("../controllers/activityTypes.controller");

const router = express.Router();

// Public: the sports you can pick when hosting an activity
router.get("/", getActivityTypes);

module.exports = router;
