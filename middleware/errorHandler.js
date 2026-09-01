/**
 * Global Error Handler Middleware
 * Catches all unhandled errors and returns consistent JSON responses
 */
const errorHandler = (err, req, res, next) => {
  console.error("Error:", err.message);
  console.error("Stack:", err.stack);

  // Supabase specific errors
  if (err.code && err.message) {
    // PostgreSQL/Supabase error codes
    const supabaseErrors = {
      23505: { status: 409, message: "Resource already exists (duplicate)." },
      23503: {
        status: 400,
        message: "Referenced resource not found (foreign key violation).",
      },
      23502: {
        status: 400,
        message: "Required field is missing (not null violation).",
      },
      "42P01": { status: 500, message: "Database table not found." },
      PGRST116: { status: 404, message: "Resource not found." },
    };

    const knownError = supabaseErrors[err.code];
    if (knownError) {
      return res.status(knownError.status).json({
        success: false,
        message: knownError.message,
        error: process.env.NODE_ENV === "development" ? err.message : undefined,
      });
    }
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({
      success: false,
      message: "Invalid authentication token.",
    });
  }

  if (err.name === "TokenExpiredError") {
    return res.status(401).json({
      success: false,
      message: "Authentication token has expired.",
    });
  }

  // Validation errors
  if (err.name === "ValidationError") {
    return res.status(400).json({
      success: false,
      message: err.message,
      errors: err.errors || [],
    });
  }

  // Multer file upload errors
  if (err.name === "MulterError") {
    const multerMessages = {
      LIMIT_FILE_SIZE: "File too large. Maximum size is 5MB.",
      LIMIT_FILE_COUNT: "Too many files. Maximum is 5.",
      LIMIT_UNEXPECTED_FILE: "Unexpected file field.",
    };

    return res.status(400).json({
      success: false,
      message: multerMessages[err.code] || "File upload error.",
    });
  }

  // Default server error
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal server error.",
    error: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
};

/**
 * 404 Not Found handler
 */
const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found.`,
  });
};

module.exports = { errorHandler, notFoundHandler };
