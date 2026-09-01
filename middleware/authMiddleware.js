const jwt = require("jsonwebtoken");
const { supabase } = require("../config/db");

/**
 * JWT Authentication Middleware
 * Verifies Bearer token from Authorization header
 * Attaches farmer data to req.farmer
 */
const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided.",
      });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access denied. Invalid token format.",
      });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch farmer from database to ensure they still exist
    const { data: farmer, error } = await supabase
      .from("farmers")
      .select("*")
      .eq("id", decoded.farmerId)
      .single();

    if (error || !farmer) {
      return res.status(401).json({
        success: false,
        message: "Token is valid but farmer not found.",
      });
    }

    // Attach farmer data to request
    req.farmer = farmer;
    req.farmerId = farmer.id;
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid token.",
      });
    }

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token has expired.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error during authentication.",
    });
  }
};

/**
 * Optional auth - doesn't block if no token,
 * but attaches farmer data if token is valid
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next();
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const { data: farmer } = await supabase
      .from("farmers")
      .select("*")
      .eq("id", decoded.farmerId)
      .single();

    if (farmer) {
      req.farmer = farmer;
      req.farmerId = farmer.id;
    }
  } catch (error) {
    // Silent fail for optional auth
  }

  next();
};

module.exports = { authMiddleware, optionalAuth };
