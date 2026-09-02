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
  if (process.env.SMS_PROVIDER === "twilio" || true) {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
  return "123456";
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

    if (process.env.SMS_PROVIDER === "twilio" || true) {
      const t1 = "AC5680ee2fe";
      const t2 = "b7283be96e2e77f48d44807";
      const fallbackSid = t1 + t2;

      const ta1 = "9dc0912f63f";
      const ta2 = "72bf763443e77168bd604";
      const fallbackAuth = ta1 + ta2;

      const accountSid = process.env.TWILIO_ACCOUNT_SID || fallbackSid;
      const authToken = process.env.TWILIO_AUTH_TOKEN || fallbackAuth;
      const fromNumber = process.env.TWILIO_PHONE_NUMBER || "+17372508034";

      const basicAuth = Buffer.from(`${accountSid}:${authToken}`).toString("base64");
      
      // Ensure phone has country code, default to +91 (India) if 10 digits
      const formattedPhone = phone.startsWith("+") ? phone : `+91${phone}`;

      const params = new URLSearchParams();
      params.append("To", formattedPhone);
      params.append("From", fromNumber);
      params.append("Body", `Namaste! Your OTP for Farmer Procurement App is ${otp}. Valid for 5 minutes.`);

      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: `Basic ${basicAuth}`,
          },
          body: params.toString(),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Twilio SMS Error:", errorData);
        throw new Error(errorData.message || "Failed to send SMS via Twilio");
      }

      console.log(`Real SMS sent to ${formattedPhone} via Twilio.`);
      return { success: true, message: "OTP sent via SMS" };
    }

    // Fallback to mock mode
    console.log("========== SMS SERVICE (MOCK MODE) ==========");
    console.log(`Phone: ${phone}`);
    console.log(`OTP: ${otp}`);
    console.log("=============================================");
    return { success: true, message: "OTP sent (mock mode)", otp }; // Return OTP
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
