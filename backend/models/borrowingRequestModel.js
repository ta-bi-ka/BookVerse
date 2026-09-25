const { pool } = require("../config/db");

const createBorrowRequest = async (userId, bookId) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Serialize new requests and librarian decisions for this book.
    const bookResult = await client.query(
      `
      SELECT book_id
      FROM books
      WHERE book_id = $1
      FOR UPDATE
      `,
      [bookId]
    );

    if (bookResult.rows.length === 0) {
      const error = new Error("Book not found");
      error.statusCode = 404;
      throw error;
    }

    const activeBorrow = await client.query(
      `
      SELECT b.borrow_id
      FROM borrows b
      JOIN book_copies c ON c.copy_id = b.copy_id
      WHERE b.user_id = $1
        AND c.book_id = $2
        AND b.return_date IS NULL
      LIMIT 1
      `,
      [userId, bookId]
    );

    if (activeBorrow.rows.length > 0) {
      const error = new Error(
        "You already have this book on loan"
      );
      error.statusCode = 409;
      throw error;
    }

    const result = await client.query(
      `
      INSERT INTO borrowing_requests (
        user_id,
        book_id,
        request_type,
        status
      )
      VALUES ($1, $2, 'borrow', 'pending')
      RETURNING *
      `,
      [userId, bookId]
    );

    await client.query("COMMIT");
    return result.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

const getMyRequests = async (userId) => {
  const result = await pool.query(
    `
    WITH pending_borrow_queue AS (
      SELECT
        request_id,
        ROW_NUMBER() OVER (
          PARTITION BY book_id
          ORDER BY requested_on, request_id
        )::integer AS queue_position
      FROM borrowing_requests
      WHERE request_type = 'borrow'
        AND status = 'pending'
    )
    SELECT
      r.request_id,
      r.book_id,
      b.title,
      r.borrow_id,
      r.request_type,
      r.status,
      r.requested_on,
      r.reviewed_on,
      r.decision_reason,
      q.queue_position
    FROM borrowing_requests r
    JOIN books b ON b.book_id = r.book_id
    LEFT JOIN pending_borrow_queue q
      ON q.request_id = r.request_id
    WHERE r.user_id = $1
    ORDER BY r.requested_on DESC, r.request_id DESC
    `,
    [userId]
  );

  return result.rows;
};

const getPendingRequests = async () => {
  const result = await pool.query(
    `
    WITH pending_borrow_queue AS (
      SELECT
        request_id,
        ROW_NUMBER() OVER (
          PARTITION BY book_id
          ORDER BY requested_on, request_id
        )::integer AS queue_position
      FROM borrowing_requests
      WHERE request_type = 'borrow'
        AND status = 'pending'
    )
    SELECT
      r.request_id,
      r.user_id,
      u.full_name,
      u.username,
      r.book_id,
      b.title,
      r.borrow_id,
      r.request_type,
      r.status,
      r.requested_on,
      q.queue_position,
      (
        SELECT COUNT(*)::integer
        FROM book_copies c
        WHERE c.book_id = r.book_id
          AND c.status = 'available'
          AND NOT EXISTS (
            SELECT 1
            FROM borrows active_loan
            WHERE active_loan.copy_id = c.copy_id
              AND active_loan.return_date IS NULL
          )
      ) AS available_copies
    FROM borrowing_requests r
    JOIN users u ON u.user_id = r.user_id
    JOIN books b ON b.book_id = r.book_id
    LEFT JOIN pending_borrow_queue q
      ON q.request_id = r.request_id
    WHERE r.status = 'pending'
    ORDER BY
      r.book_id,
      r.requested_on,
      r.request_id
    `
  );

  return result.rows;
};

const findFirstPendingBorrow = async (client, bookId) => {
  const result = await client.query(
    `
    SELECT request_id, user_id, book_id
    FROM borrowing_requests
    WHERE book_id = $1
      AND request_type = 'borrow'
      AND status = 'pending'
    ORDER BY requested_on, request_id
    LIMIT 1
    FOR UPDATE
    `,
    [bookId]
  );

  return result.rows[0] || null;
};

const lockLoanForRequest = async (client, borrowId) => {
  const result = await client.query(
    `
    SELECT
      b.borrow_id,
      b.user_id,
      b.copy_id,
      b.return_date,
      b.renew_count,
      c.book_id
    FROM borrows b
    JOIN book_copies c ON c.copy_id = b.copy_id
    WHERE b.borrow_id = $1
    FOR UPDATE OF b
    `,
    [borrowId]
  );

  return result.rows[0] || null;
};

const insertLoanRequest = async (
  client,
  userId,
  bookId,
  borrowId,
  requestType
) => {
  const result = await client.query(
    `
    INSERT INTO borrowing_requests (
      user_id,
      book_id,
      borrow_id,
      request_type,
      status
    )
    VALUES ($1, $2, $3, $4, 'pending')
    RETURNING *
    `,
    [userId, bookId, borrowId, requestType]
  );

  return result.rows[0];
};

const findReviewUser = async (client, userId) => {
  const result = await client.query(
    `
    SELECT u.user_id, u.is_active, r.role_name
    FROM users u
    JOIN roles r ON r.role_id = u.role_id
    WHERE u.user_id = $1
    FOR SHARE OF u
    `,
    [userId]
  );

  return result.rows[0] || null;
};

const lockRequest = async (client, requestId) => {
  const result = await client.query(
    `
    SELECT *
    FROM borrowing_requests
    WHERE request_id = $1
    FOR UPDATE
    `,
    [requestId]
  );

  return result.rows[0] || null;
};

const lockRequestBook = async (client, bookId) => {
  const result = await client.query(
    `
    SELECT book_id
    FROM books
    WHERE book_id = $1
    FOR UPDATE
    `,
    [bookId]
  );

  return result.rows[0] || null;
};

const findActiveLoan = async (client, userId, bookId) => {
  const result = await client.query(
    `
    SELECT b.borrow_id
    FROM borrows b
    JOIN book_copies c ON c.copy_id = b.copy_id
    WHERE b.user_id = $1
      AND c.book_id = $2
      AND b.return_date IS NULL
    LIMIT 1
    `,
    [userId, bookId]
  );

  return result.rows[0] || null;
};

const createApprovedLoan = async (client, userId, bookId) => {
  const copies = await client.query(
    `
    SELECT c.copy_id
    FROM book_copies c
    WHERE c.book_id = $1
      AND c.status = 'available'
      AND NOT EXISTS (
        SELECT 1
        FROM borrows b
        WHERE b.copy_id = c.copy_id
          AND b.return_date IS NULL
      )
    ORDER BY c.copy_id
    LIMIT 1
    FOR UPDATE OF c
    `,
    [bookId]
  );

  if (!copies.rows.length) return null;

  const copyId = copies.rows[0].copy_id;

  const result = await client.query(
    `
    INSERT INTO borrows (
      user_id,
      copy_id,
      borrow_date,
      due_date,
      return_date,
      renew_count
    )
    VALUES ($1, $2, CURRENT_DATE, CURRENT_DATE + 14, NULL, 0)
    RETURNING *
    `,
    [userId, copyId]
  );

  await client.query(
    `
    UPDATE book_copies
    SET status = 'borrowed',
        last_updated_on = CURRENT_TIMESTAMP
    WHERE copy_id = $1
    `,
    [copyId]
  );

  return result.rows[0];
};

const applyApprovedReturn = async (client, loan) => {
  await client.query(
    `
    UPDATE borrows
    SET return_date = CURRENT_DATE,
        last_updated_on = CURRENT_TIMESTAMP
    WHERE borrow_id = $1
    `,
    [loan.borrow_id]
  );

  await client.query(
    `
    UPDATE book_copies
    SET status = 'available',
        last_updated_on = CURRENT_TIMESTAMP
    WHERE copy_id = $1
    `,
    [loan.copy_id]
  );
};

const applyApprovedRenewal = async (client, borrowId) => {
  await client.query(
    `
    UPDATE borrows
    SET due_date = due_date + 7,
        renew_count = renew_count + 1,
        last_updated_on = CURRENT_TIMESTAMP
    WHERE borrow_id = $1
    `,
    [borrowId]
  );
};

const saveRequestDecision = async (
  client,
  requestId,
  status,
  reviewerId,
  reason,
  borrowId
) => {
  const result = await client.query(
    `
    UPDATE borrowing_requests
    SET status = $2,
        reviewed_by = $3,
        reviewed_on = CURRENT_TIMESTAMP,
        decision_reason = $4,
        borrow_id = $5
    WHERE request_id = $1
      AND status = 'pending'
    RETURNING *
    `,
    [requestId, status, reviewerId, reason, borrowId]
  );

  return result.rows[0] || null;
};

// Kept temporarily so an older service importing it does not fail.
// The updated approval service will use findFirstPendingBorrow instead.
const findFirstActiveReservation = async (client, bookId) => {
  const result = await client.query(
    `
    SELECT reservation_id, user_id
    FROM reservations
    WHERE book_id = $1
      AND status = 'active'
    ORDER BY queue_position, reservation_date, reservation_id
    LIMIT 1
    `,
    [bookId]
  );

  return result.rows[0] || null;
};

module.exports = {
  createBorrowRequest,
  getMyRequests,
  getPendingRequests,
  findFirstPendingBorrow,
  lockLoanForRequest,
  insertLoanRequest,
  findReviewUser,
  lockRequest,
  lockRequestBook,
  findActiveLoan,
  createApprovedLoan,
  applyApprovedReturn,
  applyApprovedRenewal,
  saveRequestDecision,
  findFirstActiveReservation,
};