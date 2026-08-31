const express = require("express");

const {
  getAllUsers,
  changeUserRole,
} = require("../controllers/adminController");

const {
  requireAuth,
  requireRole,
} = require("../middleware/authMiddleware");

const router = express.Router();

router.get(
  "/users",
  requireAuth,
  requireRole("Admin"),
  getAllUsers
);

router.patch(
  "/users/:id/role",
  requireAuth,
  requireRole("Admin"),
  changeUserRole
);

module.exports = router;