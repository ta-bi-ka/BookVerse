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

const {
  validatePositiveIntegerParam,
} = require("../middleware/validationMiddleware");

const router = express.Router();

const validateAuthorId =
  validatePositiveIntegerParam("id", "author ID");

// Public browsing
router.get("/", getAllAuthors);

router.get(
  "/:id",
  validateAuthorId,
  getAuthorById
);

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
  validateAuthorId,
  updateAuthor
);

router.delete(
  "/:id",
  requireAuth,
  requireRole("Admin", "Librarian"),
  validateAuthorId,
  deleteAuthor
);

module.exports = router;