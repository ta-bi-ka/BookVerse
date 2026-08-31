const { pool } = require("../config/db");

const shelfSelectQuery = `
  SELECT
    s.shelf_id,
    s.user_id,
    s.shelf_name,
    s.description,
    s.visibility,
    s.created_on,
    s.last_updated_on,
    u.full_name,
    u.username,
    (
      SELECT COUNT(*)::integer
      FROM bookshelf_items bi
      WHERE bi.shelf_id = s.shelf_id
    ) AS book_count
  FROM bookshelves s
  JOIN users u ON u.user_id = s.user_id
`;

const getPublicShelves = async () => {
    const result = await pool.query(`
    ${shelfSelectQuery}
    WHERE s.visibility = 'public'
    ORDER BY s.created_on DESC
  `);

    return result.rows;
};

const getUserShelves = async (userId) => {
    const result = await pool.query(
        `
      ${shelfSelectQuery}
      WHERE s.user_id = $1
      ORDER BY s.created_on DESC
    `,
        [userId]
    );

    return result.rows;
};

const getShelfById = async (shelfId) => {
    const result = await pool.query(
        `
      ${shelfSelectQuery}
      WHERE s.shelf_id = $1
    `,
        [shelfId]
    );

    return result.rows[0] || null;
};

const createShelf = async ({
    userId,
    shelfName,
    description,
    visibility,
}) => {
    const result = await pool.query(
        `
      INSERT INTO bookshelves (
        user_id,
        shelf_name,
        description,
        visibility
      )
      VALUES ($1, $2, $3, $4)
      RETURNING shelf_id
    `,
        [userId, shelfName, description, visibility]
    );

    return getShelfById(result.rows[0].shelf_id);
};

const updateShelf = async (
    shelfId,
    { shelfName, description, visibility }
) => {
    const result = await pool.query(
        `
      UPDATE bookshelves
      SET
        shelf_name = $1,
        description = $2,
        visibility = $3,
        last_updated_on = CURRENT_TIMESTAMP
      WHERE shelf_id = $4
      RETURNING shelf_id
    `,
        [shelfName, description, visibility, shelfId]
    );

    if (result.rows.length === 0) {
        return null;
    }

    return getShelfById(result.rows[0].shelf_id);
};

const deleteShelf = async (shelfId) => {
    const result = await pool.query(
        `
      DELETE FROM bookshelves
      WHERE shelf_id = $1
      RETURNING shelf_id
    `,
        [shelfId]
    );

    return result.rows[0] || null;
};

const getShelfItems = async (shelfId) => {
    const result = await pool.query(
        `
      SELECT
        bi.shelf_id,
        bi.book_id,
        bi.added_date,
        b.isbn,
        b.title
      FROM bookshelf_items bi
      JOIN books b ON b.book_id = bi.book_id
      WHERE bi.shelf_id = $1
      ORDER BY bi.added_date DESC, b.title ASC
    `,
        [shelfId]
    );

    return result.rows;
};

const findBookById = async (bookId) => {
    const result = await pool.query(
        `
      SELECT book_id, title
      FROM books
      WHERE book_id = $1
    `,
        [bookId]
    );

    return result.rows[0] || null;
};

const findShelfItem = async (shelfId, bookId) => {
    const result = await pool.query(
        `
      SELECT shelf_id, book_id, added_date
      FROM bookshelf_items
      WHERE shelf_id = $1
        AND book_id = $2
    `,
        [shelfId, bookId]
    );

    return result.rows[0] || null;
};

const addBookToShelf = async (shelfId, bookId) => {
    const result = await pool.query(
        `
      INSERT INTO bookshelf_items (shelf_id, book_id)
      VALUES ($1, $2)
      RETURNING shelf_id, book_id, added_date
    `,
        [shelfId, bookId]
    );

    return result.rows[0];
};

const removeBookFromShelf = async (shelfId, bookId) => {
    const result = await pool.query(
        `
      DELETE FROM bookshelf_items
      WHERE shelf_id = $1
        AND book_id = $2
      RETURNING shelf_id, book_id
    `,
        [shelfId, bookId]
    );

    return result.rows[0] || null;
};

module.exports = {
    getPublicShelves,
    getUserShelves,
    getShelfById,
    createShelf,
    updateShelf,
    deleteShelf,
    getShelfItems,
    findBookById,
    findShelfItem,
    addBookToShelf,
    removeBookFromShelf,
};