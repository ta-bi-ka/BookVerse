const express = require("express");

const {
  getAllReviews,
  getReviewsByBook,
  getMyReviews,
  getReviewById,
  createReview,
  updateReview,
  deleteReview,
} = require("../controllers/reviewController");

const {
  requireAuth,
  requireRole,
} = require("../middleware/authMiddleware");

const {
  validatePositiveIntegerParam,
} = require("../middleware/validationMiddleware");

const router = express.Router();

const validateReviewId =
  validatePositiveIntegerParam("id", "review ID");

const validateBookId =
  validatePositiveIntegerParam("bookId", "book ID");

// Public review browsing
router.get("/", getAllReviews);

router.get(
  "/book/:bookId",
  validateBookId,
  getReviewsByBook
);

// This must appear before "/:id"
router.get(
  "/my",
  requireAuth,
  requireRole("Student"),
  getMyReviews
);

router.get(
  "/:id",
  validateReviewId,
  getReviewById
);

// Student-owned reviews
router.post(
  "/",
  requireAuth,
  requireRole("Student"),
  createReview
);

router.put(
  "/:id",
  requireAuth,
  requireRole("Student"),
  validateReviewId,
  updateReview
);

// Students delete their own reviews; staff can moderate any review
router.delete(
  "/:id",
  requireAuth,
  requireRole("Student", "Admin", "Librarian"),
  validateReviewId,
  deleteReview
);

module.exports = router;