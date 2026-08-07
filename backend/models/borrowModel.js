const { pool } = require("../config/db");

const getUserBorrowHistory = async (userId) => {
  const result = await pool.query(
    `
    SELECT
      br.borrow_id,
      br.user_id,
      br.copy_id,
      br.borrow_date,
      br.due_date,
      br.return_date,
      br.renew_count,
      br.created_on,
      br.last_updated_on,

      bc.barcode,
      b.book_id,
      b.title,
      b.isbn

    FROM borrows br
    JOIN book_copies bc
      ON br.copy_id = bc.copy_id
    JOIN books b
      ON bc.book_id = b.book_id

    WHERE br.user_id = $1
    ORDER BY br.borrow_date DESC, br.borrow_id DESC
    `,
    [userId]
  );

  return result.rows;
};

const getBorrowById = async (borrowId) => {
  const result = await pool.query(
    `
    SELECT
      br.borrow_id,
      br.user_id,
      br.copy_id,
      br.borrow_date,
      br.due_date,
      br.return_date,
      br.renew_count,
      br.created_on,
      br.last_updated_on,
      bc.status AS copy_status,
      bc.barcode,
      b.book_id,
      b.title
    FROM borrows br
    JOIN book_copies bc
      ON br.copy_id = bc.copy_id
    JOIN books b
      ON bc.book_id = b.book_id
    WHERE br.borrow_id = $1
    `,
    [borrowId]
  );

  return result.rows[0];
};

const getAllBorrows = async () => {
  const result = await pool.query(`
    SELECT
      br.borrow_id,
      br.user_id,
      u.full_name,
      u.username,
      br.copy_id,
      bc.barcode,
      b.book_id,
      b.title,
      br.borrow_date,
      br.due_date,
      br.return_date,
      br.renew_count
    FROM borrows br
    JOIN users u
      ON br.user_id = u.user_id
    JOIN book_copies bc
      ON br.copy_id = bc.copy_id
    JOIN books b
      ON bc.book_id = b.book_id
    ORDER BY br.borrow_id DESC
  `);

  return result.rows;
};

module.exports = {
  getUserBorrowHistory,
  getBorrowById,
  getAllBorrows,
};