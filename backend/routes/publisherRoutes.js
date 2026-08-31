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

const {
  validatePositiveIntegerParam,
} = require("../middleware/validationMiddleware");

const router = express.Router();

const validatePublisherId =
  validatePositiveIntegerParam("id", "publisher ID");

router.get("/", getAllPublishers);

router.get(
  "/:id",
  validatePublisherId,
  getPublisherById
);

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
  validatePublisherId,
  updatePublisher
);

router.delete(
  "/:id",
  requireAuth,
  requireRole("Admin", "Librarian"),
  validatePublisherId,
  deletePublisher
);

module.exports = router;