const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../middleware/authMiddleware");
const {
  register,
  verifyOtp,
  login,
  logout,
  verify,
} = require("../controllers/authController");

// POST /api/auth/register - Register with phone
router.post("/register", register);

// POST /api/auth/verify-otp - Verify OTP
router.post("/verify-otp", verifyOtp);

// POST /api/auth/login - Login with phone (sends OTP)
router.post("/login", login);

// POST /api/auth/logout - Logout
router.post("/logout", logout);

// GET /api/auth/verify - Verify current token
router.get("/verify", authMiddleware, verify);

// PUT /api/auth/profile - Update farmer profile
const { updateProfile } = require("../controllers/authController");
router.put("/profile", authMiddleware, updateProfile);

module.exports = router;
