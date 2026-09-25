const express = require("express");

const {
  getAllUsers,
  changeUserRole,
} = require("../controllers/adminController");
const {
  getPendingApplications,
  approveApplication,
  declineApplication,
} = require("../controllers/librarianApplicationController");

const {
  requireAuth,
  requireRole,
} = require("../middleware/authMiddleware");

const router = express.Router();
router.get(
  "/librarian-applications",
  requireAuth,
  requireRole("Admin"),
  getPendingApplications
);

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

router.post(
  "/librarian-applications/:id/approve",
  requireAuth,
  requireRole("Admin"),
  approveApplication
);
router.post(
  "/librarian-applications/:id/decline",
  requireAuth,
  requireRole("Admin"),
  declineApplication
);

module.exports = router;