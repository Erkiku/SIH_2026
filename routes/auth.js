const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../middleware/authMiddleware");
const {
  register,
  sendOtp,
  verifyOtp,
  resendOtp,
  otpStatus,
  logout,
  verify,
  updateProfile,
  verifyFirebase,
} = require("../controllers/authController");

// POST /api/auth/register - Register with phone
router.post("/register", register);

// POST /api/auth/send-otp - Request OTP (PRD endpoint)
router.post("/send-otp", sendOtp);

// POST /api/auth/verify-otp - Verify OTP (PRD endpoint)
router.post("/verify-otp", verifyOtp);

// POST /api/auth/verify-firebase - Verify Firebase OTP
router.post("/verify-firebase", verifyFirebase);

// POST /api/auth/resend-otp - Resend OTP with 30s cooldown (PRD endpoint)
router.post("/resend-otp", resendOtp);

// GET /api/auth/otp-status/:phone - Get active OTP status (PRD endpoint)
router.get("/otp-status/:phone", otpStatus);

// POST /api/auth/login - Login with phone (sends OTP)
router.post("/login", sendOtp);

// POST /api/auth/logout - Logout
router.post("/logout", logout);

// GET /api/auth/verify - Verify current token
router.get("/verify", authMiddleware, verify);

// PUT /api/auth/profile - Update farmer profile
router.put("/profile", authMiddleware, updateProfile);

module.exports = router;

