const { pool } = require("../config/db");

const borrowBook = async (userId, bookId) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Automatically find one available physical copy of the selected book
    const copyResult = await client.query(
      `
      SELECT
        copy_id,
        book_id,
        status
      FROM book_copies
      WHERE book_id = $1
        AND status = 'available'
      ORDER BY copy_id
      LIMIT 1
      FOR UPDATE
      `,
      [bookId]
    );

    // No available physical copy exists
    if (copyResult.rows.length === 0) {
      const error = new Error(
        "No available copy found for this book"
      );
      error.statusCode = 409;
      throw error;
    }

    // Backend automatically selected this physical copy
    const copy = copyResult.rows[0];

    // Create borrow record using the selected copy_id
    const borrowResult = await client.query(
      `
      INSERT INTO borrows (
        user_id,
        copy_id,
        borrow_date,
        due_date,
        return_date,
        renew_count
      )
      VALUES (
        $1,
        $2,
        CURRENT_DATE,
        CURRENT_DATE + INTERVAL '14 days',
        NULL,
        0
      )
      RETURNING *
      `,
      [userId, copy.copy_id]
    );

    // Mark that physical copy as borrowed
    await client.query(
      `
      UPDATE book_copies
      SET
        status = 'borrowed',
        last_updated_on = CURRENT_TIMESTAMP
      WHERE copy_id = $1
      `,
      [copy.copy_id]
    );

    await client.query("COMMIT");

    return borrowResult.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

const returnBook = async (borrowId, userId, roleName) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const borrowResult = await client.query(
      `
      SELECT
        borrow_id,
        user_id,
        copy_id,
        return_date
      FROM borrows
      WHERE borrow_id = $1
      FOR UPDATE
      `,
      [borrowId]
    );

    if (borrowResult.rows.length === 0) {
      const error = new Error("Borrow record not found");
      error.statusCode = 404;
      throw error;
    }

    const borrow = borrowResult.rows[0];

    if (
      roleName === "Student" &&
      Number(borrow.user_id) !== Number(userId)
    ) {
      const error = new Error("You cannot return another user's book");
      error.statusCode = 403;
      throw error;
    }

    if (borrow.return_date) {
      const error = new Error("Book has already been returned");
      error.statusCode = 409;
      throw error;
    }

    const updatedBorrow = await client.query(
      `
      UPDATE borrows
      SET
        return_date = CURRENT_DATE,
        last_updated_on = CURRENT_TIMESTAMP
      WHERE borrow_id = $1
      RETURNING *
      `,
      [borrowId]
    );

    await client.query(
      `
      UPDATE book_copies
      SET
        status = 'available',
        last_updated_on = CURRENT_TIMESTAMP
      WHERE copy_id = $1
      `,
      [borrow.copy_id]
    );

    await client.query("COMMIT");

    return updatedBorrow.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

const renewBorrow = async (borrowId, userId, roleName) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const result = await client.query(
      `
      SELECT
        borrow_id,
        user_id,
        copy_id,
        due_date,
        return_date,
        renew_count
      FROM borrows
      WHERE borrow_id = $1
      FOR UPDATE
      `,
      [borrowId]
    );

    if (result.rows.length === 0) {
      const error = new Error("Borrow record not found");
      error.statusCode = 404;
      throw error;
    }

    const borrow = result.rows[0];

    if (
      roleName === "Student" &&
      Number(borrow.user_id) !== Number(userId)
    ) {
      const error = new Error("You cannot renew another user's borrow");
      error.statusCode = 403;
      throw error;
    }

    if (borrow.return_date) {
      const error = new Error("Returned books cannot be renewed");
      error.statusCode = 409;
      throw error;
    }

    if (borrow.renew_count >= 2) {
      const error = new Error("Maximum renewal limit reached");
      error.statusCode = 409;
      throw error;
    }

    const updated = await client.query(
      `
      UPDATE borrows
      SET
        due_date = due_date + INTERVAL '7 days',
        renew_count = renew_count + 1,
        last_updated_on = CURRENT_TIMESTAMP
      WHERE borrow_id = $1
      RETURNING *
      `,
      [borrowId]
    );

    await client.query("COMMIT");

    return updated.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  borrowBook,
  returnBook,
  renewBorrow,
};