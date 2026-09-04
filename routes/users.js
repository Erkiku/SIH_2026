const express = require("express");
const router = express.Router();
const { getUserById, getAllUsers } = require("../controllers/authController");

// GET /api/users/:userId - Get user by ID
router.get("/:userId", getUserById);

// GET /api/users - Get all users
router.get("/", getAllUsers);

module.exports = router;
