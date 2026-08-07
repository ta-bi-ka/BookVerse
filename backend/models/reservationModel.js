const { pool } = require("../config/db");

const getMyReservations = async (userId) => {
  const result = await pool.query(
    `
    SELECT
      r.reservation_id,
      r.user_id,
      r.book_id,
      b.title,
      b.isbn,
      r.reservation_date,
      r.queue_position,
      r.status,
      r.created_on,
      r.last_updated_on
    FROM reservations r
    JOIN books b
      ON r.book_id = b.book_id
    WHERE r.user_id = $1
    ORDER BY r.reservation_id DESC
    `,
    [userId]
  );

  return result.rows;
};

const getReservationById = async (reservationId) => {
  const result = await pool.query(
    `
    SELECT
      r.reservation_id,
      r.user_id,
      r.book_id,
      b.title,
      r.reservation_date,
      r.queue_position,
      r.status,
      r.created_on,
      r.last_updated_on
    FROM reservations r
    JOIN books b
      ON r.book_id = b.book_id
    WHERE r.reservation_id = $1
    `,
    [reservationId]
  );

  return result.rows[0];
};

const getAllReservations = async () => {
  const result = await pool.query(`
    SELECT
      r.reservation_id,
      r.user_id,
      u.full_name,
      u.username,
      r.book_id,
      b.title,
      r.reservation_date,
      r.queue_position,
      r.status,
      r.created_on,
      r.last_updated_on
    FROM reservations r
    JOIN users u
      ON r.user_id = u.user_id
    JOIN books b
      ON r.book_id = b.book_id
    ORDER BY r.book_id, r.queue_position, r.reservation_id
  `);

  return result.rows;
};

module.exports = {
  getMyReservations,
  getReservationById,
  getAllReservations,
};