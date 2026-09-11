const express = require("express");
const router = express.Router();
const { adminMiddleware } = require("../middleware/adminMiddleware");
const {
  adminLogin,
  getDashboardStats,
  getAllBookings,
  getBookingDetail,
  approveBooking,
  rejectBooking,
  updateBookingStatus,
  getAllFarmers,
} = require("../controllers/adminController");

// POST /api/admin/login - Admin login (no auth required)
router.post("/login", adminLogin);

// All other admin routes require admin authentication
router.use(adminMiddleware);

// GET /api/admin/dashboard - Dashboard statistics
router.get("/dashboard", getDashboardStats);

// GET /api/admin/bookings - All bookings
router.get("/bookings", getAllBookings);

// GET /api/admin/bookings/:id - Single booking detail
router.get("/bookings/:id", getBookingDetail);

// PUT /api/admin/bookings/:id/approve - Approve booking
router.put("/bookings/:id/approve", approveBooking);

// PUT /api/admin/bookings/:id/reject - Reject booking
router.put("/bookings/:id/reject", rejectBooking);

// PUT /api/admin/bookings/:id/status - Update booking status
router.put("/bookings/:id/status", updateBookingStatus);

// GET /api/admin/farmers - All farmers
router.get("/farmers", getAllFarmers);

module.exports = router;
