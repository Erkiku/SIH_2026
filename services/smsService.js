/**
 * SMS Service
 * Mock implementation for development - OTP is always 123456
 * Replace with Twilio/MSG91/TextLocal in production
 */

// In-memory OTP store (use Redis in production)
const otpStore = new Map();

// OTP expiry time in milliseconds (5 minutes)
const OTP_EXPIRY = 5 * 60 * 1000;

/**
 * Generate OTP
 * In dev mode: always returns 123456
 * In production: generates random 6-digit OTP
 */
const generateOTP = () => {
  if (
    process.env.NODE_ENV === "development" ||
    process.env.SMS_PROVIDER === "mock"
  ) {
    return "123456";
  }
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Send OTP to phone number
 */
const sendOTP = async (phone) => {
  try {
    const otp = generateOTP();

    // Store OTP with expiry
    otpStore.set(phone, {
      otp,
      createdAt: Date.now(),
      attempts: 0,
    });

    if (
      process.env.NODE_ENV === "development" ||
      process.env.SMS_PROVIDER === "mock"
    ) {
      console.log("========== SMS SERVICE (DEV MODE) ==========");
      console.log(`Phone: ${phone}`);
      console.log(`OTP: ${otp}`);
      console.log("=============================================");
      return { success: true, message: "OTP sent (dev mode)", otp }; // Return OTP in dev
    }

    // Production: Replace with actual SMS provider
    // Example with Twilio:
    // await twilioClient.messages.create({
    //   body: `Your OTP is: ${otp}`,
    //   to: phone,
    //   from: process.env.TWILIO_PHONE,
    // });

    return { success: true, message: "OTP sent" };
  } catch (error) {
    console.error("SMS service error:", error.message);
    return { success: false, message: error.message };
  }
};

/**
 * Verify OTP
 */
const verifyOTP = (phone, otp) => {
  const stored = otpStore.get(phone);

  if (!stored) {
    return {
      valid: false,
      message: "OTP not found. Please request a new one.",
    };
  }

  // Check expiry
  if (Date.now() - stored.createdAt > OTP_EXPIRY) {
    otpStore.delete(phone);
    return { valid: false, message: "OTP expired. Please request a new one." };
  }

  // Check max attempts
  if (stored.attempts >= 3) {
    otpStore.delete(phone);
    return {
      valid: false,
      message: "Too many attempts. Please request a new OTP.",
    };
  }

  // Increment attempts
  stored.attempts += 1;

  // Verify
  if (stored.otp === otp) {
    otpStore.delete(phone); // Remove after successful verification
    return { valid: true, message: "OTP verified successfully." };
  }

  return { valid: false, message: "Invalid OTP." };
};

/**
 * Send general SMS
 */
const sendSMS = async (phone, message) => {
  try {
    if (
      process.env.NODE_ENV === "development" ||
      process.env.SMS_PROVIDER === "mock"
    ) {
      console.log(`SMS to ${phone}: ${message}`);
      return { success: true };
    }

    // Production SMS sending logic here
    return { success: true };
  } catch (error) {
    console.error("SMS error:", error.message);
    return { success: false, message: error.message };
  }
};

module.exports = { sendOTP, verifyOTP, sendSMS, generateOTP };
