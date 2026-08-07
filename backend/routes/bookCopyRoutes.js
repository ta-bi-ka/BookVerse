const express = require("express");

const {
  getAllBookCopies,
  getBookCopyById,
  createBookCopy,
  updateBookCopy,
  deleteBookCopy,
} = require("../controllers/bookCopyController");

const {
  requireAuth,
  requireRole,
} = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", getAllBookCopies);
router.get("/:id", getBookCopyById);

router.post(
  "/",
  requireAuth,
  requireRole("Admin", "Librarian"),
  createBookCopy
);

router.put(
  "/:id",
  requireAuth,
  requireRole("Admin", "Librarian"),
  updateBookCopy
);

router.delete(
  "/:id",
  requireAuth,
  requireRole("Admin", "Librarian"),
  deleteBookCopy
);

module.exports = router;