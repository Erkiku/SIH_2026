const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../middleware/authMiddleware");
const {
  createCrop,
  getCrops,
  getCropById,
  updateCrop,
  deleteCrop,
} = require("../controllers/cropController");

// All crop routes require authentication
router.use(authMiddleware);

// POST /api/crops - Add new crop
router.post("/", createCrop);

// GET /api/crops - Get all farmer's crops
router.get("/", getCrops);

// GET /api/crops/:id - Get specific crop
router.get("/:id", getCropById);

// PUT /api/crops/:id - Update crop
router.put("/:id", updateCrop);

// DELETE /api/crops/:id - Delete crop
router.delete("/:id", deleteCrop);

module.exports = router;
