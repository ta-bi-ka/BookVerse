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

const fulfillReservation = async (reservationId, librarianId) => {
  const client = await pool.connect();

  const fail = (message, statusCode) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
  };

  try {
    await client.query("BEGIN");

    const librarianResult = await client.query(
      `
      SELECT u.user_id
      FROM users u
      JOIN roles r ON r.role_id = u.role_id
      WHERE u.user_id = $1
        AND u.is_active = TRUE
        AND r.role_name = 'Librarian'
      FOR SHARE OF u
      `,
      [librarianId]
    );

    if (!librarianResult.rows.length) {
      throw fail("An active Librarian account is required", 403);
    }

    const reservationInfo = await client.query(
      `
      SELECT book_id, user_id
      FROM reservations
      WHERE reservation_id = $1
      `,
      [reservationId]
    );

    if (!reservationInfo.rows.length) {
      throw fail("Reservation not found", 404);
    }
    const pendingRequest = await client.query(
      `
      SELECT request_id
      FROM borrowing_requests
      WHERE user_id = $1
        AND book_id = $2
        AND request_type = 'borrow'
        AND status = 'pending'
      FOR UPDATE
      `,
      [reservation.user_id, reservation.book_id]
    );

    // Borrow approvals also lock the book, so copy allocation is serial.
    await client.query(
      "SELECT book_id FROM books WHERE book_id = $1 FOR UPDATE",
      [reservationInfo.rows[0].user_id, reservationInfo.rows[0].book_id]
    );

    const reservationResult = await client.query(
      `
      SELECT reservation_id, user_id, book_id, status
      FROM reservations
      WHERE reservation_id = $1
      FOR UPDATE
      `,
      [reservationId]
    );

    const reservation = reservationResult.rows[0];

    if (reservation.status !== "active") {
      throw fail("Only active reservations can be fulfilled", 409);
    }

    const firstInQueue = await client.query(
      `
      SELECT reservation_id
      FROM reservations
      WHERE book_id = $1 AND status = 'active'
      ORDER BY queue_position, reservation_date, reservation_id
      LIMIT 1
      `,
      [reservation.book_id]
    );

    if (
      Number(firstInQueue.rows[0]?.reservation_id) !==
      Number(reservationId)
    ) {
      throw fail("Only the first reservation can be fulfilled", 409);
    }

    const student = await client.query(
      `
      SELECT u.user_id
      FROM users u
      JOIN roles r ON r.role_id = u.role_id
      WHERE u.user_id = $1
        AND u.is_active = TRUE
        AND r.role_name = 'Student'
      FOR SHARE OF u
      `,
      [reservation.user_id]
    );

    if (!student.rows.length) {
      throw fail("The student account is not active", 409);
    }

    const existingLoan = await client.query(
      `
      SELECT b.borrow_id
      FROM borrows b
      JOIN book_copies c ON c.copy_id = b.copy_id
      WHERE b.user_id = $1
        AND c.book_id = $2
        AND b.return_date IS NULL
      LIMIT 1
      `,
      [reservation.user_id, reservation.book_id]
    );

    if (existingLoan.rows.length) {
      throw fail("This student already has the book on loan", 409);
    }

    const copyResult = await client.query(
      `
      SELECT c.copy_id
      FROM book_copies c
      WHERE c.book_id = $1
        AND c.status = 'available'
        AND NOT EXISTS (
          SELECT 1
          FROM borrows b
          WHERE b.copy_id = c.copy_id
            AND b.return_date IS NULL
        )
      ORDER BY c.copy_id
      LIMIT 1
      FOR UPDATE OF c
      `,
      [reservation.book_id]
    );

    if (!copyResult.rows.length) {
      throw fail(
        "No available copy. The reservation remains active.",
        409
      );
    }

    const loanResult = await client.query(
      `
      INSERT INTO borrows (
        user_id, copy_id, borrow_date, due_date,
        return_date, renew_count
      )
      VALUES ($1, $2, CURRENT_DATE, CURRENT_DATE + 14, NULL, 0)
      RETURNING *
      `,
      [reservation.user_id, copyResult.rows[0].copy_id]
    );

    const loan = loanResult.rows[0];

    await client.query(
      `
      UPDATE book_copies
      SET status = 'borrowed',
          last_updated_on = CURRENT_TIMESTAMP
      WHERE copy_id = $1
      `,
      [loan.copy_id]
    );

    // If the student also submitted a borrow request, approve it.


    if (pendingRequest.rows.length) {
      await client.query(
        `
        UPDATE borrowing_requests
        SET status = 'approved',
            borrow_id = $2,
            reviewed_by = $3,
            reviewed_on = CURRENT_TIMESTAMP
        WHERE request_id = $1
        `,
        [
          pendingRequest.rows[0].request_id,
          loan.borrow_id,
          librarianId,
        ]
      );
    } else {
      await client.query(
        `
        INSERT INTO borrowing_requests (
          user_id, book_id, borrow_id, request_type,
          status, reviewed_by, reviewed_on
        )
        VALUES (
          $1, $2, $3, 'borrow',
          'approved', $4, CURRENT_TIMESTAMP
        )
        `,
        [
          reservation.user_id,
          reservation.book_id,
          loan.borrow_id,
          librarianId,
        ]
      );
    }

    const updated = await client.query(
      `
      UPDATE reservations
      SET status = 'fulfilled',
          last_updated_on = CURRENT_TIMESTAMP
      WHERE reservation_id = $1
      RETURNING *
      `,
      [reservationId]
    );

    await renumberActiveQueue(client, reservation.book_id);

    await client.query("COMMIT");

    return {
      ...updated.rows[0],
      borrow_id: loan.borrow_id,
      copy_id: loan.copy_id,
      due_date: loan.due_date,
    };
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