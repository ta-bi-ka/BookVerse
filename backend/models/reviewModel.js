const { pool } = require("../config/db");

const reviewSelectQuery = `
  SELECT
    r.review_id,
    r.user_id,
    r.book_id,
    r.rating,
    r.review_text,
    r.created_on,
    r.last_updated_on,
    u.full_name,
    u.username,
    b.title,
    b.isbn
  FROM reviews r
  JOIN users u
    ON r.user_id = u.user_id
  JOIN books b
    ON r.book_id = b.book_id
`;

const getAllReviews = async () => {
  const result = await pool.query(`
    ${reviewSelectQuery}
    ORDER BY r.created_on DESC, r.review_id DESC
  `);

  return result.rows;
};

const getReviewsByBook = async (bookId) => {
  const result = await pool.query(
    `
    ${reviewSelectQuery}
    WHERE r.book_id = $1
    ORDER BY r.created_on DESC, r.review_id DESC
    `,
    [bookId]
  );

  return result.rows;
};

const getMyReviews = async (userId) => {
  const result = await pool.query(
    `
    ${reviewSelectQuery}
    WHERE r.user_id = $1
    ORDER BY r.created_on DESC, r.review_id DESC
    `,
    [userId]
  );

  return result.rows;
};

const getReviewById = async (reviewId) => {
  const result = await pool.query(
    `
    ${reviewSelectQuery}
    WHERE r.review_id = $1
    `,
    [reviewId]
  );

  return result.rows[0];
};

const findUserReviewForBook = async (userId, bookId) => {
  const result = await pool.query(
    `
    SELECT review_id
    FROM reviews
    WHERE user_id = $1
      AND book_id = $2
    `,
    [userId, bookId]
  );

  return result.rows[0];
};

const createReview = async ({
  userId,
  bookId,
  rating,
  reviewText,
}) => {
  const result = await pool.query(
    `
    INSERT INTO reviews (
      user_id,
      book_id,
      rating,
      review_text
    )
    VALUES ($1, $2, $3, $4)
    RETURNING *
    `,
    [userId, bookId, rating, reviewText || null]
  );

  return result.rows[0];
};

const updateReview = async ({
  reviewId,
  rating,
  reviewText,
}) => {
  const result = await pool.query(
    `
    UPDATE reviews
    SET
      rating = $2,
      review_text = $3,
      last_updated_on = CURRENT_TIMESTAMP
    WHERE review_id = $1
    RETURNING *
    `,
    [reviewId, rating, reviewText || null]
  );

  return result.rows[0];
};

const deleteReview = async (reviewId) => {
  const result = await pool.query(
    `
    DELETE FROM reviews
    WHERE review_id = $1
    RETURNING review_id
    `,
    [reviewId]
  );

  return result.rows[0];
};

module.exports = {
  getAllReviews,
  getReviewsByBook,
  getMyReviews,
  getReviewById,
  findUserReviewForBook,
  createReview,
  updateReview,
  deleteReview,
};