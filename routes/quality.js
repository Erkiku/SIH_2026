const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../middleware/authMiddleware");
const {
  getQualityCheck,
  getQualityHistory,
} = require("../controllers/qualityController");

// All quality routes require authentication
router.use(authMiddleware);

// GET /api/quality/history/:farmerId - Past quality records
// Must be before /:bookingId to avoid route conflict
router.get("/history/:farmerId", getQualityHistory);

// GET /api/quality/:bookingId - Quality check results
router.get("/:bookingId", getQualityCheck);

module.exports = router;
