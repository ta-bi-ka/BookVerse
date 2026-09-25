const express = require("express");

const {
  getMyReservations,
  getAllReservations,
  cancelReservation,
} = require("../controllers/reservationController");

const {
  requireAuth,
  requireRole,
} = require("../middleware/authMiddleware");

const router = express.Router();

// Existing reservation records remain accessible during the transition.
// New borrow requests use POST /api/borrows instead.
router.get(
  "/my",
  requireAuth,
  requireRole("Student"),
  getMyReservations
);

router.get(
  "/",
  requireAuth,
  requireRole("Admin", "Librarian"),
  getAllReservations
);

router.post(
  "/:id/cancel",
  requireAuth,
  cancelReservation
);

module.exports = router;