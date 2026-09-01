const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../middleware/authMiddleware");
const {
  createBooking,
  getBookings,
  getBookingById,
  updateBooking,
  cancelBooking,
  getBookingStatus,
  getQueuePosition,
} = require("../controllers/bookingController");

// All booking routes require authentication
router.use(authMiddleware);

// POST /api/bookings - Create booking
router.post("/", createBooking);

// GET /api/bookings - Get all bookings
router.get("/", getBookings);

// GET /api/bookings/:id - Get specific booking
router.get("/:id", getBookingById);

// PUT /api/bookings/:id - Update booking
router.put("/:id", updateBooking);

// DELETE /api/bookings/:id - Cancel booking
router.delete("/:id", cancelBooking);

// GET /api/bookings/:id/status - Real-time status
router.get("/:id/status", getBookingStatus);

// GET /api/bookings/:id/position - Queue position
router.get("/:id/position", getQueuePosition);

module.exports = router;
