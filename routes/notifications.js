const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../middleware/authMiddleware");
const {
  getNotifications,
  markAsRead,
  deleteNotification,
  registerDevice,
} = require("../controllers/notificationController");

// All notification routes require authentication
router.use(authMiddleware);

// GET /api/notifications - Get all notifications
router.get("/", getNotifications);

// PUT /api/notifications/:id - Mark as read
router.put("/:id", markAsRead);

// DELETE /api/notifications/:id - Delete notification
router.delete("/:id", deleteNotification);

// POST /api/notifications/device - Register FCM token
router.post("/device", registerDevice);

module.exports = router;
