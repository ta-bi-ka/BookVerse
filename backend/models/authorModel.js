const { pool } = require("../config/db");

const getAllAuthors = async () => {
  const result = await pool.query(`
    SELECT
      author_id,
      author_name,
      nationality,
      biography,
      created_on,
      last_updated_on
    FROM authors
    ORDER BY author_id ASC
  `);

  return result.rows;
};

const getAuthorById = async (authorId) => {
  const result = await pool.query(
    `
    SELECT
      author_id,
      author_name,
      nationality,
      biography,
      created_on,
      last_updated_on
    FROM authors
    WHERE author_id = $1
    `,
    [authorId]
  );

  return result.rows[0];
};

const createAuthor = async ({ authorName, nationality, biography }) => {
  const result = await pool.query(
    `
    INSERT INTO authors (
      author_name,
      nationality,
      biography
    )
    VALUES ($1, $2, $3)
    RETURNING *
    `,
    [authorName, nationality || null, biography || null]
  );

  return result.rows[0];
};

const updateAuthor = async (
  authorId,
  { authorName, nationality, biography }
) => {
  const result = await pool.query(
    `
    UPDATE authors
    SET
      author_name = $1,
      nationality = $2,
      biography = $3,
      last_updated_on = CURRENT_TIMESTAMP
    WHERE author_id = $4
    RETURNING *
    `,
    [
      authorName,
      nationality || null,
      biography || null,
      authorId,
    ]
  );

  return result.rows[0];
};

const deleteAuthor = async (authorId) => {
  const result = await pool.query(
    `
    DELETE FROM authors
    WHERE author_id = $1
    RETURNING *
    `,
    [authorId]
  );

  return result.rows[0];
};

module.exports = {
  getAllAuthors,
  getAuthorById,
  createAuthor,
  updateAuthor,
  deleteAuthor,
};