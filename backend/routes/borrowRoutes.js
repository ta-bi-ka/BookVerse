const express = require("express");

const {
  borrowBook,
  returnBook,
  renewBorrow,
  getMyBorrows,
  getAllBorrows,
  getMyRequests,
  getPendingRequests,
  approveRequest,
  declineRequest,
} = require("../controllers/borrowController");

const {
  requireAuth,
  requireRole,
} = require("../middleware/authMiddleware");

const router = express.Router();
router.post(
  "/requests/:id/approve",
  requireAuth,
  requireRole("Librarian"),
  approveRequest
);

router.post(
  "/requests/:id/decline",
  requireAuth,
  requireRole("Librarian"),
  declineRequest
);
router.get(
  "/requests/my",
  requireAuth,
  requireRole("Student"),
  getMyRequests
);
router.get(
  "/requests/pending",
  requireAuth,
  requireRole("Librarian"),
  getPendingRequests
);

router.post(
  "/",
  requireAuth,
  requireRole("Student"),
  borrowBook
);

router.get(
  "/my",
  requireAuth,
  requireRole("Student"),
  getMyBorrows
);

router.get(
  "/",
  requireAuth,
  requireRole("Admin", "Librarian"),
  getAllBorrows
);

router.post("/:id/return", requireAuth, returnBook);

router.post("/:id/renew", requireAuth, renewBorrow);

module.exports = router;