const borrowModel = require("../models/borrowModel");
const borrowService = require("../services/borrowService");

const borrowBook = async (req, res) => {
  try {
    const { bookId } = req.body;

    const normalizedBookId = Number(bookId);

if (
  !Number.isInteger(normalizedBookId) ||
  normalizedBookId <= 0
) {
  return res.status(400).json({
    success: false,
    message: "A valid bookId is required",
  });
}

    const borrow = await borrowService.borrowBook(
      req.session.userId,
      normalizedBookId
    );

    res.status(201).json({
      success: true,
      message: "Book borrowed successfully",
      data: borrow,
    });
  } catch (error) {
    console.error("Borrow book error:", error);

    if (error.code === "22P02") {
      return res.status(400).json({
        success: false,
        message: "Invalid bookId",
      });
    }

    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to borrow book",
    });
  }
};

const returnBook = async (req, res) => {
  try {
    const { id } = req.params;
const borrowId = Number(id);

if (
  !Number.isInteger(borrowId) ||
  borrowId <= 0
) {
  return res.status(400).json({
    success: false,
    message: "A valid borrow ID is required",
  });
}
    const borrow = await borrowService.returnBook(
      borrowId,
      req.session.userId,
      req.session.roleName
    );

    res.status(200).json({
      success: true,
      message: "Book returned successfully",
      data: borrow,
    });
  } catch (error) {
    console.error("Return book error:", error);

    if (error.code === "22P02") {
      return res.status(400).json({
        success: false,
        message: "Invalid borrow ID",
      });
    }

    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to return book",
    });
  }
};

const renewBorrow = async (req, res) => {
  try {
    const { id } = req.params;
const borrowId = Number(id);

if (
  !Number.isInteger(borrowId) ||
  borrowId <= 0
) {
  return res.status(400).json({
    success: false,
    message: "A valid borrow ID is required",
  });
}
    const borrow = await borrowService.renewBorrow(
      borrowId,
      req.session.userId,
      req.session.roleName
    );

    res.status(200).json({
      success: true,
      message: "Borrow renewed successfully",
      data: borrow,
    });
  } catch (error) {
    console.error("Renew borrow error:", error);

    if (error.code === "22P02") {
      return res.status(400).json({
        success: false,
        message: "Invalid borrow ID",
      });
    }

    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to renew borrow",
    });
  }
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

module.exports = {
  borrowBook,
  returnBook,
  renewBorrow,
  getMyBorrows,
  getAllBorrows,
};