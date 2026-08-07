const express = require("express");

const {
  getAllBooks,
  getBookById,
  createBook,
  searchBooks,
  updateBook,
  deleteBook,
} = require("../controllers/bookController");

const {
  requireAuth,
  requireRole,
} = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", getAllBooks);
router.get("/search", searchBooks);
router.get("/:id", getBookById);


router.post(
  "/",
  requireAuth,
  requireRole("Admin", "Librarian"),
  createBook
);

router.put(
  "/:id",
  requireAuth,
  requireRole("Admin", "Librarian"),
  updateBook
);

router.delete(
  "/:id",
  requireAuth,
  requireRole("Admin", "Librarian"),
  deleteBook
);

module.exports = router;