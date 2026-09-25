const express = require("express");
const {
  getStaffDirectory,
} = require("../controllers/staffDirectoryController");
const {
  requireAuth,
  requireRole,
} = require("../middleware/authMiddleware");

const router = express.Router();

router.get(
  "/",
  requireAuth,
  requireRole("Admin", "Librarian"),
  getStaffDirectory
);

module.exports = router;