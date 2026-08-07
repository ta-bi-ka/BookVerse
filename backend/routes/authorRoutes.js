const express = require("express");

const {
  getAllAuthors,
  getAuthorById,
  createAuthor,
  updateAuthor,
  deleteAuthor,
} = require("../controllers/authorController");

const {
  requireAuth,
  requireRole,
} = require("../middleware/authMiddleware");

const router = express.Router();

// Public / logged-in browsing
router.get("/", getAllAuthors);
router.get("/:id", getAuthorById);

// Librarian and Admin management
router.post(
  "/",
  requireAuth,
  requireRole("Admin", "Librarian"),
  createAuthor
);

router.put(
  "/:id",
  requireAuth,
  requireRole("Admin", "Librarian"),
  updateAuthor
);

router.delete(
  "/:id",
  requireAuth,
  requireRole("Admin", "Librarian"),
  deleteAuthor
);

module.exports = router;