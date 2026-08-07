const { pool } = require("../config/db");

const createReservation = async (userId, bookId) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Lock book so reservation queue for this book is updated safely
    const bookResult = await client.query(
      `
      SELECT book_id, title
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

    // Reservation only needed when no physical copy is available
    const availableResult = await client.query(
      `
      SELECT copy_id
      FROM book_copies
      WHERE book_id = $1
        AND status = 'available'
      LIMIT 1
      `,
      [bookId]
    );

    if (availableResult.rows.length > 0) {
      const error = new Error(
        "An available copy exists. Borrow the book instead of reserving it"
      );
      error.statusCode = 409;
      throw error;
    }

    // Prevent duplicate active reservation
    const duplicateResult = await client.query(
      `
      SELECT reservation_id
      FROM reservations
      WHERE user_id = $1
        AND book_id = $2
        AND status = 'active'
      `,
      [userId, bookId]
    );

    if (duplicateResult.rows.length > 0) {
      const error = new Error(
        "You already have an active reservation for this book"
      );
      error.statusCode = 409;
      throw error;
    }

    const queueResult = await client.query(
      `
      SELECT COALESCE(MAX(queue_position), 0) + 1 AS next_position
      FROM reservations
      WHERE book_id = $1
        AND status = 'active'
      `,
      [bookId]
    );

    const queuePosition = queueResult.rows[0].next_position;

    const reservationResult = await client.query(
      `
      INSERT INTO reservations (
        user_id,
        book_id,
        reservation_date,
        queue_position,
        status
      )
      VALUES (
        $1,
        $2,
        CURRENT_DATE,
        $3,
        'active'
      )
      RETURNING *
      `,
      [userId, bookId, queuePosition]
    );

    await client.query("COMMIT");

    return reservationResult.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

const renumberActiveQueue = async (client, bookId) => {
  await client.query(
    `
    WITH ordered AS (
      SELECT
        reservation_id,
        ROW_NUMBER() OVER (
          ORDER BY reservation_date, reservation_id
        ) AS new_position
      FROM reservations
      WHERE book_id = $1
        AND status = 'active'
    )
    UPDATE reservations r
    SET
      queue_position = ordered.new_position,
      last_updated_on = CURRENT_TIMESTAMP
    FROM ordered
    WHERE r.reservation_id = ordered.reservation_id
    `,
    [bookId]
  );
};

const cancelReservation = async (
  reservationId,
  userId,
  roleName
) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const result = await client.query(
      `
      SELECT
        reservation_id,
        user_id,
        book_id,
        status
      FROM reservations
      WHERE reservation_id = $1
      FOR UPDATE
      `,
      [reservationId]
    );

    if (result.rows.length === 0) {
      const error = new Error("Reservation not found");
      error.statusCode = 404;
      throw error;
    }

    const reservation = result.rows[0];

    if (
      roleName === "Student" &&
      Number(reservation.user_id) !== Number(userId)
    ) {
      const error = new Error(
        "You cannot cancel another user's reservation"
      );
      error.statusCode = 403;
      throw error;
    }

    if (reservation.status !== "active") {
      const error = new Error(
        "Only active reservations can be cancelled"
      );
      error.statusCode = 409;
      throw error;
    }

    const updatedResult = await client.query(
      `
      UPDATE reservations
      SET
        status = 'cancelled',
        last_updated_on = CURRENT_TIMESTAMP
      WHERE reservation_id = $1
      RETURNING *
      `,
      [reservationId]
    );

    await renumberActiveQueue(
      client,
      reservation.book_id
    );

    await client.query("COMMIT");

    return updatedResult.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

const fulfillReservation = async (reservationId) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const result = await client.query(
      `
      SELECT
        reservation_id,
        book_id,
        queue_position,
        status
      FROM reservations
      WHERE reservation_id = $1
      FOR UPDATE
      `,
      [reservationId]
    );

    if (result.rows.length === 0) {
      const error = new Error("Reservation not found");
      error.statusCode = 404;
      throw error;
    }

    const reservation = result.rows[0];

    if (reservation.status !== "active") {
      const error = new Error(
        "Only active reservations can be fulfilled"
      );
      error.statusCode = 409;
      throw error;
    }

    if (Number(reservation.queue_position) !== 1) {
      const error = new Error(
        "Only the first reservation in the queue can be fulfilled"
      );
      error.statusCode = 409;
      throw error;
    }

    const updatedResult = await client.query(
      `
      UPDATE reservations
      SET
        status = 'fulfilled',
        last_updated_on = CURRENT_TIMESTAMP
      WHERE reservation_id = $1
      RETURNING *
      `,
      [reservationId]
    );

    await renumberActiveQueue(
      client,
      reservation.book_id
    );

    await client.query("COMMIT");

    return updatedResult.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  createReservation,
  cancelReservation,
  fulfillReservation,
};