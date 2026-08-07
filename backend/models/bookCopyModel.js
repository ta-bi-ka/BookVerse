const { pool } = require("../config/db");

const getAllBookCopies = async () => {
  const result = await pool.query(`
    SELECT
      bc.copy_id,
      bc.book_id,
      bc.barcode,
      bc.status,
      bc.condition,
      bc.shelf_location,
      bc.acquisition_date,
      bc.created_on,
      bc.last_updated_on,
      json_build_object(
        'book_id', b.book_id,
        'publisher_id', b.publisher_id,
        'isbn', b.isbn,
        'title', b.title
      ) AS book
    FROM book_copies bc
    JOIN books b ON b.book_id = bc.book_id
    ORDER BY bc.copy_id ASC
  `);

  return result.rows;
};

const getBookCopyById = async (copyId) => {
  const result = await pool.query(
    `
    SELECT
      bc.copy_id,
      bc.book_id,
      bc.barcode,
      bc.status,
      bc.condition,
      bc.shelf_location,
      bc.acquisition_date,
      bc.created_on,
      bc.last_updated_on,
      json_build_object(
        'book_id', b.book_id,
        'publisher_id', b.publisher_id,
        'isbn', b.isbn,
        'title', b.title
      ) AS book
    FROM book_copies bc
    JOIN books b ON b.book_id = bc.book_id
    WHERE bc.copy_id = $1
    `,
    [copyId]
  );

  return result.rows[0];
};

const createBookCopy = async (
  {
    bookId,
    barcode,
    status,
    condition,
    shelfLocation,
    acquisitionDate,
  }
) => {
  if (status === undefined || status === null || status === "") {
    const result = await pool.query(
      `
      INSERT INTO book_copies (
        book_id,
        barcode,
        condition,
        shelf_location,
        acquisition_date
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
      `,
      [
        bookId,
        barcode,
        condition || null,
        shelfLocation || null,
        acquisitionDate || null,
      ]
    );

    return result.rows[0];
  }

  const result = await pool.query(
    `
    INSERT INTO book_copies (
      book_id,
      barcode,
      status,
      condition,
      shelf_location,
      acquisition_date
    )
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
    `,
    [
      bookId,
      barcode,
      status,
      condition || null,
      shelfLocation || null,
      acquisitionDate || null,
    ]
  );

  return result.rows[0];
};

const updateBookCopy = async (
  copyId,
  {
    bookId,
    barcode,
    status,
    condition,
    shelfLocation,
    acquisitionDate,
  }
) => {
  const result = await pool.query(
    `
    UPDATE book_copies
    SET
      book_id = $1,
      barcode = $2,
      status = $3,
      condition = $4,
      shelf_location = $5,
      acquisition_date = $6,
      last_updated_on = CURRENT_TIMESTAMP
    WHERE copy_id = $7
    RETURNING *
    `,
    [
      bookId,
      barcode,
      status,
      condition || null,
      shelfLocation || null,
      acquisitionDate || null,
      copyId,
    ]
  );

  return result.rows[0];
};

const deleteBookCopy = async (copyId) => {
  const result = await pool.query(
    `
    DELETE FROM book_copies
    WHERE copy_id = $1
    RETURNING *
    `,
    [copyId]
  );

  return result.rows[0];
};

module.exports = {
  getAllBookCopies,
  getBookCopyById,
  createBookCopy,
  updateBookCopy,
  deleteBookCopy,
};