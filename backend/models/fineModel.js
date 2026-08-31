const { pool } = require("../config/db");

const fineSelectQuery = `
  SELECT
    f.fine_id,
    f.borrow_id,
    f.amount,
    f.reason,
    f.payment_date,
    f.created_on,
    f.last_updated_on,
    (f.payment_date IS NOT NULL) AS is_paid,
    br.user_id,
    br.borrow_date,
    br.due_date,
    br.return_date,
    u.full_name,
    u.username,
    b.book_id,
    b.title,
    b.isbn
  FROM fines f
  JOIN borrows br ON br.borrow_id = f.borrow_id
  JOIN users u ON u.user_id = br.user_id
  JOIN book_copies bc ON bc.copy_id = br.copy_id
  JOIN books b ON b.book_id = bc.book_id
`;

const getAllFines = async () => {
    const result = await pool.query(`
    ${fineSelectQuery}
    ORDER BY f.created_on DESC
  `);

    return result.rows;
};

const getUserFines = async (userId) => {
    const result = await pool.query(
        `
      ${fineSelectQuery}
      WHERE br.user_id = $1
      ORDER BY f.created_on DESC
    `,
        [userId]
    );

    return result.rows;
};

const getFineById = async (fineId) => {
    const result = await pool.query(
        `
      ${fineSelectQuery}
      WHERE f.fine_id = $1
    `,
        [fineId]
    );

    return result.rows[0] || null;
};

const getFineByBorrowId = async (borrowId) => {
    const result = await pool.query(
        `
      ${fineSelectQuery}
      WHERE f.borrow_id = $1
    `,
        [borrowId]
    );

    return result.rows[0] || null;
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
        b.book_id,
        b.title
      FROM borrows br
      JOIN book_copies bc ON bc.copy_id = br.copy_id
      JOIN books b ON b.book_id = bc.book_id
      WHERE br.borrow_id = $1
    `,
        [borrowId]
    );

    return result.rows[0] || null;
};

const createFine = async ({
    borrowId,
    amount,
    reason,
}) => {
    const result = await pool.query(
        `
      INSERT INTO fines (
        borrow_id,
        amount,
        reason
      )
      VALUES ($1, $2, $3)
      RETURNING fine_id
    `,
        [borrowId, amount, reason]
    );

    return getFineById(result.rows[0].fine_id);
};

const updateFine = async (
    fineId,
    { amount, reason }
) => {
    const result = await pool.query(
        `
      UPDATE fines
      SET
        amount = $1,
        reason = $2,
        last_updated_on = CURRENT_TIMESTAMP
      WHERE fine_id = $3
      RETURNING fine_id
    `,
        [amount, reason, fineId]
    );

    if (result.rows.length === 0) {
        return null;
    }

    return getFineById(result.rows[0].fine_id);
};

const markFinePaid = async (fineId, paymentDate) => {
    const result = await pool.query(
        `
      UPDATE fines
      SET
        payment_date = COALESCE($2::date, CURRENT_DATE),
        last_updated_on = CURRENT_TIMESTAMP
      WHERE fine_id = $1
      RETURNING fine_id
    `,
        [fineId, paymentDate]
    );

    if (result.rows.length === 0) {
        return null;
    }

    return getFineById(result.rows[0].fine_id);
};

const markFineUnpaid = async (fineId) => {
    const result = await pool.query(
        `
      UPDATE fines
      SET
        payment_date = NULL,
        last_updated_on = CURRENT_TIMESTAMP
      WHERE fine_id = $1
      RETURNING fine_id
    `,
        [fineId]
    );

    if (result.rows.length === 0) {
        return null;
    }

    return getFineById(result.rows[0].fine_id);
};

const deleteFine = async (fineId) => {
    const result = await pool.query(
        `
      DELETE FROM fines
      WHERE fine_id = $1
      RETURNING fine_id
    `,
        [fineId]
    );

    return result.rows[0] || null;
};

module.exports = {
    getAllFines,
    getUserFines,
    getFineById,
    getFineByBorrowId,
    getBorrowById,
    createFine,
    updateFine,
    markFinePaid,
    markFineUnpaid,
    deleteFine,
};