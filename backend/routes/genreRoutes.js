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

const router = express.Router();

router.get("/", getAllGenres);
router.get("/:id", getGenreById);

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
  updateGenre
);

router.delete(
  "/:id",
  requireAuth,
  requireRole("Admin", "Librarian"),
  deleteGenre
);

module.exports = router;