const express = require("express");

const {
  getAllGenres,
  getGenreById,
  createGenre,
  updateGenre,
  deleteGenre,
} = require("../controllers/genreController");

const {
  requireAuth,
  requireRole,
} = require("../middleware/authMiddleware");

const {
  validatePositiveIntegerParam,
} = require("../middleware/validationMiddleware");

const router = express.Router();

const validateGenreId =
  validatePositiveIntegerParam("id", "genre ID");

router.get("/", getAllGenres);

router.get(
  "/:id",
  validateGenreId,
  getGenreById
);

router.post(
  "/",
  requireAuth,
  requireRole("Admin", "Librarian"),
  createGenre
);

router.put(
  "/:id",
  requireAuth,
  requireRole("Admin", "Librarian"),
  validateGenreId,
  updateGenre
);

router.delete(
  "/:id",
  requireAuth,
  requireRole("Admin", "Librarian"),
  validateGenreId,
  deleteGenre
);

module.exports = router;