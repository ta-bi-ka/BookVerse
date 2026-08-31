const reviewModel = require("../models/reviewModel");

const isValidPositiveInteger = (value) => {
  return Number.isInteger(value) && value > 0;
};

const isValidRating = (value) => {
  return Number.isInteger(value) && value >= 1 && value <= 5;
};

const normalizeReviewText = (reviewText) => {
  if (reviewText === undefined || reviewText === null) {
    return null;
  }

  if (typeof reviewText !== "string") {
    return undefined;
  }

  return reviewText.trim() || null;
};

const getAllReviews = async (req, res) => {
  try {
    const reviews = await reviewModel.getAllReviews();

    return res.status(200).json({
      success: true,
      count: reviews.length,
      data: reviews,
    });
  } catch (error) {
    console.error("Get reviews error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch reviews",
    });
  }
};

const getReviewsByBook = async (req, res) => {
  try {
    const bookId = Number(req.params.bookId);

    const reviews = await reviewModel.getReviewsByBook(bookId);

    return res.status(200).json({
      success: true,
      count: reviews.length,
      data: reviews,
    });
  } catch (error) {
    console.error("Get book reviews error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch book reviews",
    });
  }
};

const getMyReviews = async (req, res) => {
  try {
    const reviews = await reviewModel.getMyReviews(
      req.session.userId
    );

    return res.status(200).json({
      success: true,
      count: reviews.length,
      data: reviews,
    });
  } catch (error) {
    console.error("Get my reviews error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch your reviews",
    });
  }
};

const getReviewById = async (req, res) => {
  try {
    const reviewId = Number(req.params.id);

    const review = await reviewModel.getReviewById(reviewId);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: review,
    });
  } catch (error) {
    console.error("Get review error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch review",
    });
  }
};

const createReview = async (req, res) => {
  try {
    const bookId = Number(req.body.bookId);
    const rating = Number(req.body.rating);
    const reviewText = normalizeReviewText(req.body.reviewText);

    if (!isValidPositiveInteger(bookId)) {
      return res.status(400).json({
        success: false,
        message: "A valid bookId is required",
      });
    }

    if (!isValidRating(rating)) {
      return res.status(400).json({
        success: false,
        message: "Rating must be a whole number from 1 to 5",
      });
    }

    if (reviewText === undefined) {
      return res.status(400).json({
        success: false,
        message: "Review text must be provided as text",
      });
    }

    if (reviewText && reviewText.length > 2000) {
      return res.status(400).json({
        success: false,
        message: "Review text must not exceed 2000 characters",
      });
    }

    const existingReview =
      await reviewModel.findUserReviewForBook(
        req.session.userId,
        bookId
      );

    if (existingReview) {
      return res.status(409).json({
        success: false,
        message: "You have already reviewed this book",
      });
    }

    const createdReview = await reviewModel.createReview({
      userId: req.session.userId,
      bookId,
      rating,
      reviewText,
    });

    const review = await reviewModel.getReviewById(
      createdReview.review_id
    );

    return res.status(201).json({
      success: true,
      message: "Review created successfully",
      data: review,
    });
  } catch (error) {
    console.error("Create review error:", error);

    if (error.code === "23503") {
      return res.status(404).json({
        success: false,
        message: "Book not found",
      });
    }

    if (error.code === "23514") {
      return res.status(400).json({
        success: false,
        message: "Invalid review data",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to create review",
    });
  }
};

const updateReview = async (req, res) => {
  try {
    const reviewId = Number(req.params.id);
    const rating = Number(req.body.rating);
    const reviewText = normalizeReviewText(req.body.reviewText);

    if (!isValidRating(rating)) {
      return res.status(400).json({
        success: false,
        message: "Rating must be a whole number from 1 to 5",
      });
    }

    if (reviewText === undefined) {
      return res.status(400).json({
        success: false,
        message: "Review text must be provided as text",
      });
    }

    if (reviewText && reviewText.length > 2000) {
      return res.status(400).json({
        success: false,
        message: "Review text must not exceed 2000 characters",
      });
    }

    const existingReview = await reviewModel.getReviewById(
      reviewId
    );

    if (!existingReview) {
      return res.status(404).json({
        success: false,
        message: "Review not found",
      });
    }

    if (
      Number(existingReview.user_id) !==
      Number(req.session.userId)
    ) {
      return res.status(403).json({
        success: false,
        message: "You cannot update another user's review",
      });
    }

    await reviewModel.updateReview({
      reviewId,
      rating,
      reviewText,
    });

    const review = await reviewModel.getReviewById(reviewId);

    return res.status(200).json({
      success: true,
      message: "Review updated successfully",
      data: review,
    });
  } catch (error) {
    console.error("Update review error:", error);

    if (error.code === "23514") {
      return res.status(400).json({
        success: false,
        message: "Invalid review data",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update review",
    });
  }
};

const deleteReview = async (req, res) => {
  try {
    const reviewId = Number(req.params.id);

    const existingReview = await reviewModel.getReviewById(
      reviewId
    );

    if (!existingReview) {
      return res.status(404).json({
        success: false,
        message: "Review not found",
      });
    }

    if (
      req.session.roleName === "Student" &&
      Number(existingReview.user_id) !==
      Number(req.session.userId)
    ) {
      return res.status(403).json({
        success: false,
        message: "You cannot delete another user's review",
      });
    }

    await reviewModel.deleteReview(reviewId);

    return res.status(200).json({
      success: true,
      message: "Review deleted successfully",
    });
  } catch (error) {
    console.error("Delete review error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete review",
    });
  }
};

module.exports = {
  getAllReviews,
  getReviewsByBook,
  getMyReviews,
  getReviewById,
  createReview,
  updateReview,
  deleteReview,
};