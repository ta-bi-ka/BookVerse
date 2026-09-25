const { pool } = require("../config/db");
const requestModel = require("../models/borrowingRequestModel");

const createError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const createLoanRequest = async (
  userId,
  borrowId,
  requestType
) => {
  if (!["return", "renew"].includes(requestType)) {
    throw createError("Invalid request type", 400);
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Find the book first so every operation locks book, then loan.
    const loanBookResult = await client.query(
      `
      SELECT c.book_id
      FROM borrows b
      JOIN book_copies c ON c.copy_id = b.copy_id
      WHERE b.borrow_id = $1
      `,
      [borrowId]
    );

    if (!loanBookResult.rows.length) {
      throw createError("Borrow record not found", 404);
    }

    const bookId = loanBookResult.rows[0].book_id;
    const book = await requestModel.lockRequestBook(
      client,
      bookId
    );

    if (!book) {
      throw createError("Book not found", 404);
    }

    const loan = await requestModel.lockLoanForRequest(
      client,
      borrowId
    );

    if (!loan) {
      throw createError("Borrow record not found", 404);
    }

    if (Number(loan.book_id) !== Number(bookId)) {
      throw createError("Borrow record changed. Please retry.", 409);
    }

    if (Number(loan.user_id) !== Number(userId)) {
      throw createError(
        "You can only submit requests for your own loans",
        403
      );
    }

    if (loan.return_date) {
      throw createError("This book has already been returned", 409);
    }

    if (requestType === "renew") {
      if (loan.renew_count >= 2) {
        throw createError("Maximum renewal limit reached", 409);
      }

      const waitingStudent =
        await requestModel.findFirstPendingBorrow(
          client,
          bookId
        );

      if (waitingStudent) {
        throw createError(
          "Another student is waiting for this book",
          409
        );
      }
    }

    const request = await requestModel.insertLoanRequest(
      client,
      userId,
      bookId,
      borrowId,
      requestType
    );

    await client.query("COMMIT");
    return request;
  } catch (error) {
    await client.query("ROLLBACK");

    if (
      error.code === "23505" &&
      error.constraint === "uq_pending_loan_request"
    ) {
      throw createError(
        "You already have a pending return or renewal request for this loan",
        409
      );
    }

    throw error;
  } finally {
    client.release();
  }
};

const reviewRequest = async (
  requestId,
  reviewerId,
  decision,
  reason = null
) => {
  if (!["approved", "declined"].includes(decision)) {
    throw createError("Invalid decision", 400);
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const reviewer = await requestModel.findReviewUser(
      client,
      reviewerId
    );

    if (
      !reviewer ||
      !reviewer.is_active ||
      reviewer.role_name !== "Librarian"
    ) {
      throw createError(
        "An active Librarian account is required",
        403
      );
    }

    // Read the book ID, then lock the book before locking the
    // request. New requests and decisions now use this order.
    const requestBookResult = await client.query(
      `
      SELECT book_id
      FROM borrowing_requests
      WHERE request_id = $1
      `,
      [requestId]
    );

    if (!requestBookResult.rows.length) {
      throw createError("Request not found", 404);
    }

    const bookId = requestBookResult.rows[0].book_id;
    const book = await requestModel.lockRequestBook(
      client,
      bookId
    );

    if (!book) {
      throw createError("Book not found", 404);
    }

    const request = await requestModel.lockRequest(
      client,
      requestId
    );

    if (!request) {
      throw createError("Request not found", 404);
    }

    if (Number(request.book_id) !== Number(bookId)) {
      throw createError("Request changed. Please retry.", 409);
    }

    if (request.status !== "pending") {
      throw createError(
        "This request has already been reviewed",
        409
      );
    }

    if (Number(request.user_id) === Number(reviewerId)) {
      throw createError(
        "You cannot review your own request",
        403
      );
    }

    let borrowId = request.borrow_id;

    if (decision === "approved") {
      if (request.request_type === "borrow") {
        // This check is on the server, inside the transaction.
        // A later student cannot bypass it by calling the API.
        const firstRequest =
          await requestModel.findFirstPendingBorrow(
            client,
            request.book_id
          );

        if (
          !firstRequest ||
          Number(firstRequest.request_id) !==
            Number(request.request_id)
        ) {
          throw createError(
            "Approve the first pending borrow request for this book before later requests",
            409
          );
        }

        const student = await requestModel.findReviewUser(
          client,
          request.user_id
        );

        if (
          !student ||
          !student.is_active ||
          student.role_name !== "Student"
        ) {
          throw createError(
            "The applicant must have an active Student account",
            409
          );
        }

        const existingLoan =
          await requestModel.findActiveLoan(
            client,
            request.user_id,
            request.book_id
          );

        if (existingLoan) {
          throw createError(
            "This student already has this book on loan",
            409
          );
        }

        const loan = await requestModel.createApprovedLoan(
          client,
          request.user_id,
          request.book_id
        );

        if (!loan) {
          throw createError(
            "No available copy. The request remains pending.",
            409
          );
        }

        borrowId = loan.borrow_id;
      } else if (
        request.request_type === "return" ||
        request.request_type === "renew"
      ) {
        const loan =
          await requestModel.lockLoanForRequest(
            client,
            request.borrow_id
          );

        if (!loan) {
          throw createError(
            "Borrow record not found",
            404
          );
        }

        if (
          Number(loan.user_id) !== Number(request.user_id) ||
          Number(loan.book_id) !== Number(request.book_id)
        ) {
          throw createError(
            "This request does not match its borrowing record",
            409
          );
        }

        if (loan.return_date) {
          throw createError(
            "This book has already been returned",
            409
          );
        }

        if (request.request_type === "return") {
          await requestModel.applyApprovedReturn(
            client,
            loan
          );
        } else {
          if (loan.renew_count >= 2) {
            throw createError(
              "Maximum renewal limit reached",
              409
            );
          }

          // Recheck at approval time: someone may have joined
          // the book's waiting list after renewal was requested.
          const waitingStudent =
            await requestModel.findFirstPendingBorrow(
              client,
              request.book_id
            );

          if (waitingStudent) {
            throw createError(
              "Another student is waiting for this book",
              409
            );
          }

          await requestModel.applyApprovedRenewal(
            client,
            loan.borrow_id
          );
        }
      } else {
        throw createError(
          "Invalid request type",
          400
        );
      }
    }

    const updatedRequest =
      await requestModel.saveRequestDecision(
        client,
        requestId,
        decision,
        reviewerId,
        decision === "declined" ? reason : null,
        borrowId
      );

    if (!updatedRequest) {
      throw createError(
        "This request has already been reviewed",
        409
      );
    }

    await client.query("COMMIT");
    return updatedRequest;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  createLoanRequest,
  reviewRequest,
};