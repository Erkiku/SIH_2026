const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
require("dotenv").config();

const { errorHandler, notFoundHandler } = require("./middleware/errorHandler");
const { setupSocket } = require("./socket/realtime");

// Import routes
const authRoutes = require("./routes/auth");
const cropRoutes = require("./routes/crops");
const centerRoutes = require("./routes/centers");
const bookingRoutes = require("./routes/bookings");
const slotRoutes = require("./routes/slots");
const qualityRoutes = require("./routes/quality");
const notificationRoutes = require("./routes/notifications");
const userRoutes = require("./routes/users");
const { isFirebaseConfigured } = require("./config/firebase");

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "*",
    methods: ["GET", "POST"],
  },
});

// Setup real-time socket events
const socketHelpers = setupSocket(io);

// Make socket helpers available in controllers via req.app
app.set("io", io);
app.set("socketHelpers", socketHelpers);

// ========================
// MIDDLEWARE
// ========================

// CORS
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "*",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);

// Parse JSON body
app.use(express.json({ limit: "10mb" }));

// Parse URL-encoded body
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Request logging (dev mode)
if (process.env.NODE_ENV === "development") {
  app.use((req, res, next) => {
    console.log(
      `${new Date().toISOString()} | ${req.method} ${req.originalUrl}`,
    );
    next();
  });
}

// ========================
// API ROUTES
// ========================

// Health check endpoints
const healthCheckHandler = (req, res) => {
  res.json({
    status: "ok",
    success: true,
    message: "Farmer Procurement API is running!",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    firebase: isFirebaseConfigured ? "connected" : "not_configured",
    connectedClients: socketHelpers.getConnectedCount(),
  });
};

app.get("/health", healthCheckHandler);
app.get("/api/health", healthCheckHandler);

// Mount routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/crops", cropRoutes);
app.use("/api/centers", centerRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/slots", slotRoutes);
app.use("/api/quality", qualityRoutes);
app.use("/api/notifications", notificationRoutes);

// Transaction routes (inline - simpler)
const { authMiddleware } = require("./middleware/authMiddleware");
const { supabase } = require("./config/db");
const TransactionModel = require("./models/Transaction");

// GET /api/transactions/:farmerId - Payment history
app.get(
  "/api/transactions/:farmerId",
  authMiddleware,
  async (req, res, next) => {
    try {
      const { farmerId } = req.params;

      const { data: transactions, error } = await supabase
        .from(TransactionModel.tableName)
        .select("*")
        .eq("farmer_id", farmerId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      res.json({
        success: true,
        data: (transactions || []).map(TransactionModel.format),
        count: transactions ? transactions.length : 0,
      });
    } catch (error) {
      next(error);
    }
  },
);

// GET /api/transactions/booking/:bookingId - Specific transaction
app.get(
  "/api/transactions/booking/:bookingId",
  authMiddleware,
  async (req, res, next) => {
    try {
      const { bookingId } = req.params;

      const { data: transaction, error } = await supabase
        .from(TransactionModel.tableName)
        .select("*")
        .eq("booking_id", bookingId)
        .single();

      if (error || !transaction) {
        return res.status(404).json({
          success: false,
          message: "Transaction not found.",
        });
      }

      res.json({
        success: true,
        data: TransactionModel.format(transaction),
      });
    } catch (error) {
      next(error);
    }
  },
);

// POST /api/transactions/receipt - Generate receipt (placeholder)
app.post(
  "/api/transactions/receipt",
  authMiddleware,
  async (req, res, next) => {
    try {
      const { transactionId } = req.body;

      const { data: transaction } = await supabase
        .from(TransactionModel.tableName)
        .select("*")
        .eq("id", transactionId)
        .single();

      if (!transaction) {
        return res.status(404).json({
          success: false,
          message: "Transaction not found.",
        });
      }

      // In production, generate PDF receipt here
      res.json({
        success: true,
        message: "Receipt generated.",
        data: {
          receiptUrl:
            transaction.receipt_url ||
            `/api/transactions/receipt/${transactionId}`,
          transaction: TransactionModel.format(transaction),
        },
      });
    } catch (error) {
      next(error);
    }
  },
);

// ========================
// ERROR HANDLING
// ========================

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

// ========================
// START SERVER
// ========================

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log("==========================================");
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`🔗 API URL: http://localhost:${PORT}/api`);
  console.log(`💚 Health check: http://localhost:${PORT}/api/health`);
  console.log("==========================================");
});

module.exports = { app, server, io };
