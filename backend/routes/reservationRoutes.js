const express = require("express");

const {
  createReservation,
  getMyReservations,
  getAllReservations,
  cancelReservation,
  fulfillReservation,
} = require("../controllers/reservationController");

const {
  requireAuth,
  requireRole,
} = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", requireAuth, createReservation);

router.get("/my", requireAuth, getMyReservations);

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

router.post(
  "/:id/fulfill",
  requireAuth,
  requireRole("Admin", "Librarian"),
  fulfillReservation
);

module.exports = router;