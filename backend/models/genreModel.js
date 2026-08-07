const { pool } = require("../config/db");

const getAllGenres = async () => {
  const result = await pool.query(`
    SELECT
      genre_id,
      genre_name,
      description,
      created_on,
      last_updated_on
    FROM genres
    ORDER BY genre_id ASC
  `);

  return result.rows;
};

const getGenreById = async (genreId) => {
  const result = await pool.query(
    `
    SELECT
      genre_id,
      genre_name,
      description,
      created_on,
      last_updated_on
    FROM genres
    WHERE genre_id = $1
    `,
    [genreId]
  );

  return result.rows[0];
};

const createGenre = async ({ genreName, description }) => {
  const result = await pool.query(
    `
    INSERT INTO genres (
      genre_name,
      description
    )
    VALUES ($1, $2)
    RETURNING *
    `,
    [genreName, description || null]
  );

  return result.rows[0];
};

const updateGenre = async (
  genreId,
  { genreName, description }
) => {
  const result = await pool.query(
    `
    UPDATE genres
    SET
      genre_name = $1,
      description = $2,
      last_updated_on = CURRENT_TIMESTAMP
    WHERE genre_id = $3
    RETURNING *
    `,
    [
      genreName,
      description || null,
      genreId,
    ]
  );

  return result.rows[0];
};

const deleteGenre = async (genreId) => {
  const result = await pool.query(
    `
    DELETE FROM genres
    WHERE genre_id = $1
    RETURNING *
    `,
    [genreId]
  );

  return result.rows[0];
};

module.exports = {
  getAllGenres,
  getGenreById,
  createGenre,
  updateGenre,
  deleteGenre,
};