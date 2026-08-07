const express = require("express");

const {
  getAllPublishers,
  getPublisherById,
  createPublisher,
  updatePublisher,
  deletePublisher,
} = require("../controllers/publisherController");

const {
  requireAuth,
  requireRole,
} = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", getAllPublishers);
router.get("/:id", getPublisherById);

router.post(
  "/",
  requireAuth,
  requireRole("Admin", "Librarian"),
  createPublisher
);

router.put(
  "/:id",
  requireAuth,
  requireRole("Admin", "Librarian"),
  updatePublisher
);

router.delete(
  "/:id",
  requireAuth,
  requireRole("Admin", "Librarian"),
  deletePublisher
);

module.exports = router;