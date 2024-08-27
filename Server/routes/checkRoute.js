const router = require("express").Router();
const checkController = require("../controllers/checkController");
const { verifyOwnership } = require("../middleware/verifyOwnership");
const Monitor = require("../models/Monitor");

router.post(
  "/:monitorId",
  verifyOwnership(Monitor, "monitorId"),
  checkController.createCheck
);

router.get(
  "/:monitorId",
  verifyOwnership(Monitor, "monitorId"),
  checkController.getChecks
);

router.get("/user/:userId", checkController.getUserChecks);

router.delete(
  "/:monitorId",
  verifyOwnership(Monitor, "monitorId"),
  checkController.deleteChecks
);

module.exports = router;
