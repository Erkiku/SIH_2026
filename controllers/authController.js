const jwt = require("jsonwebtoken");
const { supabase } = require("../config/db");
const FarmerModel = require("../models/Farmer");
const { sendOTP, verifyOTP, getOTPStatus } = require("../services/smsService");


/**
 * POST /api/auth/register
 * Register a new farmer with phone + OTP
 */
const register = async (req, res, next) => {
  try {
    const { phone, name, email, address, state, district, pincode } = req.body;

    // Validate
    const validation = FarmerModel.validate({ phone, name });
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validation.errors,
      });
    }

    // Check if farmer already exists
    const { data: existing } = await supabase
      .from(FarmerModel.tableName)
      .select("id")
      .eq("phone", phone)
      .single();

    if (existing) {
      return res.status(409).json({
        success: false,
        message: "Phone number already registered. Please login.",
      });
    }

    // Create farmer record
    const { data: farmer, error } = await supabase
      .from(FarmerModel.tableName)
      .insert({
        phone,
        name,
        email: email || null,
        address: address || null,
        state: state || null,
        district: district || null,
        pincode: pincode || null,
        is_verified: false,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Send OTP
    const otpResult = await sendOTP(phone);

    res.status(201).json({
      success: true,
      message: "Registration successful. OTP sent to your phone.",
      data: {
        farmerId: farmer.id,
        phone: farmer.phone,
        otpSent: otpResult.success,
        // Include OTP in dev mode for testing
        ...(process.env.NODE_ENV === "development" && { otp: otpResult.otp }),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/verify-otp
 * Verify OTP and return JWT token
 */
/**
 * POST /api/auth/verify-otp
 * Verify OTP and return JWT token + Firebase Custom Token
 */
const verifyOtp = async (req, res, next) => {
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({
        success: false,
        error: "missing_fields",
        message: "Phone and OTP required",
      });
    }

    const formattedPhone = phone.startsWith("+") ? phone : `+91${phone}`;

    // Verify OTP (checks Firebase Firestore & in-memory store)
    const result = await verifyOTP(phone, otp);

    if (!result.valid) {
      return res.status(401).json({
        success: false,
        error: result.error || "invalid_otp",
        message: result.message,
        attemptsRemaining: result.attemptsRemaining,
      });
    }

    // 1. Firebase Auth & Firestore user sync if configured
    let firebaseUserId = null;
    let customToken = null;
    const { db, auth, admin, isFirebaseConfigured } = require("../config/firebase");

    if (isFirebaseConfigured) {
      try {
        if (auth) {
          let userRecord;
          try {
            userRecord = await auth.getUserByPhoneNumber(formattedPhone);
          } catch (fbErr) {
            if (fbErr.code === "auth/user-not-found") {
              userRecord = await auth.createUser({
                phoneNumber: formattedPhone,
                disabled: false,
              });
            } else {
              console.warn("Firebase getUserByPhoneNumber warning:", fbErr.message);
            }
          }
          if (userRecord) {
            firebaseUserId = userRecord.uid;
            customToken = await auth.createCustomToken(firebaseUserId);
          }
        }

        if (db && (firebaseUserId || formattedPhone)) {
          const docId = firebaseUserId || formattedPhone;
          await db.collection("users").doc(docId).set(
            {
              phone: formattedPhone,
              last_login: admin.firestore.FieldValue.serverTimestamp(),
              verified: true,
              ...(firebaseUserId ? {} : { created_at: admin.firestore.FieldValue.serverTimestamp() }),
            },
            { merge: true }
          );
        }
      } catch (fbSyncErr) {
        console.warn("⚠️ Firebase user sync warning:", fbSyncErr.message);
      }
    }

    // 2. Fetch/upsert farmer in Supabase database
    let farmer = null;
    try {
      const { data: existingFarmer } = await supabase
        .from(FarmerModel.tableName)
        .select("*")
        .eq("phone", phone)
        .single();

      if (existingFarmer) {
        farmer = existingFarmer;
        await supabase
          .from(FarmerModel.tableName)
          .update({ is_verified: true })
          .eq("id", existingFarmer.id);
      } else {
        // Auto-register farmer record
        const { data: newFarmer } = await supabase
          .from(FarmerModel.tableName)
          .insert({
            phone: phone,
            name: `Farmer ${phone.slice(-4)}`,
            is_verified: true,
          })
          .select()
          .single();
        farmer = newFarmer;
      }
    } catch (sbErr) {
      console.warn("Supabase farmer lookup warning:", sbErr.message);
    }

    const userId = farmer ? farmer.id : firebaseUserId || `user-${Date.now()}`;

    // 3. Generate JWT Token
    const fallbackJwt = "farmer_procurement_jwt_secret_2026_sih";
    const token = jwt.sign(
      { farmerId: userId, phone: formattedPhone },
      process.env.JWT_SECRET || fallbackJwt,
      { expiresIn: "30d" }
    );

    console.log(`✅ OTP verified for ${formattedPhone}`);

    res.status(200).json({
      success: true,
      message: "OTP verified successfully",
      userId: userId,
      token: token,
      customToken: customToken || token,
      expiresIn: 3600,
      ...(farmer && { farmer: FarmerModel.format(farmer) }),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/send-otp
 * Standalone Send OTP endpoint
 */
const sendOtp = async (req, res, next) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({
        success: false,
        error: "invalid_phone",
        message: "Phone number is required.",
      });
    }

    const metadata = {
      ip: req.ip,
      userAgent: req.get("user-agent"),
    };

    const otpResult = await sendOTP(phone, metadata);

    if (!otpResult.success) {
      return res.status(otpResult.status || 400).json({
        success: false,
        error: otpResult.error || "send_failed",
        message: otpResult.message,
        retry_after: otpResult.retry_after,
      });
    }

    res.status(200).json({
      success: true,
      message: `OTP sent successfully to ${phone}`,
      expiresIn: 300,
      resendAfter: 30,
      request_id: `req-${Date.now()}`,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/resend-otp
 * Resend OTP with 30s cooldown check
 */
const resendOtp = async (req, res, next) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({
        success: false,
        error: "invalid_phone",
        message: "Phone number is required.",
      });
    }

    const metadata = {
      ip: req.ip,
      userAgent: req.get("user-agent"),
    };

    const otpResult = await sendOTP(phone, metadata);

    if (!otpResult.success) {
      return res.status(otpResult.status || 400).json({
        success: false,
        error: otpResult.error || "resend_failed",
        message: otpResult.message,
        retry_after: otpResult.retry_after,
      });
    }

    res.status(200).json({
      success: true,
      message: `New OTP sent to ${phone}`,
      resendAfter: 30,
      expiresIn: 300,
      ...(process.env.NODE_ENV === "development" && { testOTP: otpResult.otp, otp: otpResult.otp }),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/users/:userId
 * Get user details by ID from Firestore or Supabase
 */
const getUserById = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { db } = require("../config/firebase");

    if (db) {
      const userDoc = await db.collection("users").doc(userId).get();
      if (userDoc.exists) {
        return res.status(200).json({
          success: true,
          user: {
            userId: userDoc.id,
            ...userDoc.data(),
          },
        });
      }
    }

    const { data: farmer } = await supabase
      .from(FarmerModel.tableName)
      .select("*")
      .eq("id", userId)
      .single();

    if (!farmer) {
      return res.status(404).json({
        success: false,
        error: "not_found",
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      user: FarmerModel.format(farmer),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/users
 * Get list of users from Firestore or Supabase
 */
const getAllUsers = async (req, res, next) => {
  try {
    const { db } = require("../config/firebase");

    if (db) {
      const usersSnapshot = await db
        .collection("users")
        .orderBy("created_at", "desc")
        .limit(50)
        .get();

      const users = [];
      usersSnapshot.forEach((doc) => {
        users.push({
          userId: doc.id,
          ...doc.data(),
        });
      });

      if (users.length > 0) {
        return res.status(200).json({
          success: true,
          count: users.length,
          users: users,
        });
      }
    }

    const { data: farmers } = await supabase
      .from(FarmerModel.tableName)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    res.status(200).json({
      success: true,
      count: farmers ? farmers.length : 0,
      users: (farmers || []).map(FarmerModel.format),
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  verifyOtp,
  sendOtp,
  resendOtp,
  otpStatus,
  logout,
  verify,
  updateProfile,
  getUserById,
  getAllUsers,
};

