const borrowModel = require("../models/borrowModel");
const borrowingRequestService =
  require("../services/borrowingRequestService");
const borrowingRequestModel = require("../models/borrowingRequestModel");

const borrowBook = async (req, res) => {
  try {
    const { bookId } = req.body || {};

    const normalizedBookId = Number(bookId);

    if (
      !["string", "number"].includes(typeof bookId) ||
      !Number.isInteger(normalizedBookId) ||
      normalizedBookId <= 0 ||
      normalizedBookId > 2147483647
    ) {
      return res.status(400).json({
        success: false,
        message: "A valid bookId is required",
      });
    }

    const request = await borrowingRequestModel.createBorrowRequest(
      req.session.userId,
      normalizedBookId
    );

    return res.status(201).json({
      success: true,
      message: "Borrow request submitted. Pending librarian approval.",
      data: request,
    });
  } catch (error) {
    console.error("Borrow request error:", error);

    if (
      error.code === "23505" &&
      error.constraint === "uq_pending_borrow_request"
    ) {
      return res.status(409).json({
        success: false,
        message: "You already have a pending request for this book",
      });
    }

    const statusCode =
      error.statusCode === 404 || error.statusCode === 409
        ? error.statusCode
        : 500;

    return res.status(statusCode).json({
      success: false,
      message:
        statusCode === 500
          ? "Failed to submit borrow request"
          : error.message,
    });
  }
};
const submitLoanRequest = async (req, res, requestType) => {
  const borrowId = Number(req.params.id);

  if (
    !Number.isInteger(borrowId) ||
    borrowId <= 0 ||
    borrowId > 2147483647
  ) {
    return res.status(400).json({
      success: false,
      message: "A valid borrow ID is required",
    });
  }

  try {
    const request = await borrowingRequestService.createLoanRequest(
      req.session.userId,
      borrowId,
      requestType
    );

    return res.status(201).json({
      success: true,
      message:
        requestType === "return"
          ? "Return request submitted. Pending librarian approval."
          : "Renewal request submitted. Pending librarian approval.",
      data: request,
    });
  } catch (error) {
    console.error("Submit loan request error:", error);

    const statusCode = [400, 403, 404, 409].includes(error.statusCode)
      ? error.statusCode
      : 500;

    return res.status(statusCode).json({
      success: false,
      message:
        statusCode === 500
          ? "Failed to submit your request"
          : error.message,
    });
  }
};

const returnBook = (req, res) => {
  return submitLoanRequest(req, res, "return");
};

const renewBorrow = (req, res) => {
  return submitLoanRequest(req, res, "renew");
};
const getMyBorrows = async (req, res) => {
  try {
    const borrows = await borrowModel.getUserBorrowHistory(
      req.session.userId
    );

    res.status(200).json({
      success: true,
      count: borrows.length,
      data: borrows,
    });
  } catch (error) {
    console.error("Get my borrows error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch borrowing history",
    });
  }
};

const getAllBorrows = async (req, res) => {
  try {
    const borrows = await borrowModel.getAllBorrows();

    res.status(200).json({
      success: true,
      count: borrows.length,
      data: borrows,
    });
  } catch (error) {
    console.error("Get all borrows error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch borrowing records",
    });
  }
};

const getMyRequests = async (req, res) => {
  try {
    const requests = await borrowingRequestModel.getMyRequests(
      req.session.userId
    );

    res.set("Cache-Control", "no-store");

    return res.status(200).json({
      success: true,
      count: requests.length,
      data: requests,
    });
  } catch (error) {
    console.error("Get borrowing requests error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load your borrowing requests",
    });
  }
};
const getPendingRequests = async (req, res) => {
  try {
    const requests =
      await borrowingRequestModel.getPendingRequests();

    res.set("Cache-Control", "no-store");

    return res.status(200).json({
      success: true,
      count: requests.length,
      data: requests,
    });
  } catch (error) {
    console.error("Get pending requests error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load pending requests",
    });
  }
};
const handleRequestReview = async (req, res, decision) => {
  const requestId = Number(req.params.id);
  const { reason = null } = req.body || {};

  if (
    !Number.isInteger(requestId) ||
    requestId <= 0 ||
    requestId > 2147483647
  ) {
    return res.status(400).json({
      success: false,
      message: "A valid request ID is required",
    });
  }

  if (
    reason !== null &&
    (typeof reason !== "string" || reason.trim().length > 500)
  ) {
    return res.status(400).json({
      success: false,
      message: "Reason must be text with at most 500 characters",
    });
  }

  try {
    const request = await borrowingRequestService.reviewRequest(
      requestId,
      req.session.userId,
      decision,
      typeof reason === "string" ? reason.trim() || null : null
    );

    const messages = {
      borrow: "Borrow approved. The book is now on loan.",
      return: "Return approved. The book has been returned.",
      renew: "Renewal approved. The due date has been extended.",
    };

    return res.status(200).json({
      success: true,
      message:
        decision === "declined"
          ? "Request declined."
          : messages[request.request_type],
      data: request,
    });
  } catch (error) {
    console.error("Review borrowing request error:", error);

    const statusCode = [400, 403, 404, 409].includes(error.statusCode)
      ? error.statusCode
      : 500;

    return res.status(statusCode).json({
      success: false,
      message:
        statusCode === 500
          ? "Could not review the request"
          : error.message,
    });
  }
};

const approveRequest = (req, res) => {
  return handleRequestReview(req, res, "approved");
};

const declineRequest = (req, res) => {
  return handleRequestReview(req, res, "declined");
};
module.exports = {
  borrowBook,
  returnBook,
  renewBorrow,
  getMyBorrows,
  getAllBorrows,
  getMyRequests,
  getPendingRequests,
  approveRequest,
  declineRequest,
};