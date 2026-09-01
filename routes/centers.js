const express = require("express");
const router = express.Router();
const {
  getAllCenters,
  getCenterById,
  getCenterSlots,
  getCenterQueue,
  getNearbyCenters,
} = require("../controllers/centerController");

// GET /api/centers/nearby - Nearby centers (must be before /:id to avoid conflict)
router.get("/nearby", getNearbyCenters);

// GET /api/centers - All centers
router.get("/", getAllCenters);

// GET /api/centers/:id - Center details
router.get("/:id", getCenterById);

// GET /api/centers/:id/slots - Available slots for a center
router.get("/:id/slots", getCenterSlots);

// GET /api/centers/:id/queue - Current queue status
router.get("/:id/queue", getCenterQueue);

module.exports = router;
