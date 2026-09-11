const jwt = require("jsonwebtoken");

/**
 * Admin Authentication Middleware
 * Verifies JWT token and checks for admin role
 */
const adminMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No admin token provided.",
      });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access denied. Invalid token format.",
      });
    }

    const fallbackJwt = "farmer_procurement_jwt_secret_2026_sih";
    const decoded = jwt.verify(token, process.env.JWT_SECRET || fallbackJwt);

    if (decoded.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin privileges required.",
      });
    }

    req.admin = {
      id: decoded.adminId,
      email: decoded.email,
      role: decoded.role,
      name: decoded.name,
    };

    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid admin token.",
      });
    }

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Admin token has expired. Please login again.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error during admin authentication.",
    });
  }
};

module.exports = { adminMiddleware };
