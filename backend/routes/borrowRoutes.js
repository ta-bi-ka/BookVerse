const express = require("express");

const {
  borrowBook,
  returnBook,
  renewBorrow,
  getMyBorrows,
  getAllBorrows,
} = require("../controllers/borrowController");

const {
  requireAuth,
  requireRole,
} = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", requireAuth, borrowBook);

router.get("/my", requireAuth, getMyBorrows);

router.get(
  "/",
  requireAuth,
  requireRole("Admin", "Librarian"),
  getAllBorrows
);

router.post("/:id/return", requireAuth, returnBook);

router.post("/:id/renew", requireAuth, renewBorrow);

module.exports = router;