const { pool } = require("../config/db");

const getAllPublishers = async () => {
  const result = await pool.query(`
    SELECT
      publisher_id,
      publisher_name,
      country,
      website,
      created_on,
      last_updated_on
    FROM publishers
    ORDER BY publisher_id ASC
  `);

  return result.rows;
};

const getPublisherById = async (publisherId) => {
  const result = await pool.query(
    `
    SELECT
      publisher_id,
      publisher_name,
      country,
      website,
      created_on,
      last_updated_on
    FROM publishers
    WHERE publisher_id = $1
    `,
    [publisherId]
  );

  return result.rows[0];
};

const createPublisher = async ({
  publisherName,
  country,
  website,
}) => {
  const result = await pool.query(
    `
    INSERT INTO publishers (
      publisher_name,
      country,
      website
    )
    VALUES ($1, $2, $3)
    RETURNING *
    `,
    [
      publisherName,
      country || null,
      website || null,
    ]
  );

  return result.rows[0];
};

const updatePublisher = async (
  publisherId,
  {
    publisherName,
    country,
    website,
  }
) => {
  const result = await pool.query(
    `
    UPDATE publishers
    SET
      publisher_name = $1,
      country = $2,
      website = $3,
      last_updated_on = CURRENT_TIMESTAMP
    WHERE publisher_id = $4
    RETURNING *
    `,
    [
      publisherName,
      country || null,
      website || null,
      publisherId,
    ]
  );

  return result.rows[0];
};

const deletePublisher = async (publisherId) => {
  const result = await pool.query(
    `
    DELETE FROM publishers
    WHERE publisher_id = $1
    RETURNING *
    `,
    [publisherId]
  );

  return result.rows[0];
};

module.exports = {
  getAllPublishers,
  getPublisherById,
  createPublisher,
  updatePublisher,
  deletePublisher,
};