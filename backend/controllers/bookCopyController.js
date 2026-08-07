const bookCopyModel = require("../models/bookCopyModel");

const getAllBookCopies = async (req, res) => {
  try {
    const bookCopies = await bookCopyModel.getAllBookCopies();

    res.status(200).json({
      success: true,
      count: bookCopies.length,
      data: bookCopies,
    });
  } catch (error) {
    console.error("Get book copies error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch book copies",
    });
  }
};

const getBookCopyById = async (req, res) => {
  try {
    const { id } = req.params;

    const bookCopy = await bookCopyModel.getBookCopyById(id);

    if (!bookCopy) {
      return res.status(404).json({
        success: false,
        message: "Book copy not found",
      });
    }

    res.status(200).json({
      success: true,
      data: bookCopy,
    });
  } catch (error) {
    console.error("Get book copy error:", error);

    if (error.code === "22P02") {
      return res.status(400).json({
        success: false,
        message: "Invalid book copy ID",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to fetch book copy",
    });
  }
};

const createBookCopy = async (req, res) => {
  try {
    const {
      bookId,
      barcode,
      status,
      condition,
      shelfLocation,
      acquisitionDate,
    } = req.body;

    if (!bookId || !barcode || !barcode.trim()) {
      return res.status(400).json({
        success: false,
        message: "Book ID and barcode are required",
      });
    }

    const bookCopy = await bookCopyModel.createBookCopy({
      bookId,
      barcode: barcode.trim(),
      status,
      condition,
      shelfLocation,
      acquisitionDate,
    });

    const createdBookCopy = await bookCopyModel.getBookCopyById(
      bookCopy.copy_id
    );

    res.status(201).json({
      success: true,
      message: "Book copy created successfully",
      data: createdBookCopy,
    });
  } catch (error) {
    console.error("Create book copy error:", error);

    if (error.code === "22P02") {
      return res.status(400).json({
        success: false,
        message: "Invalid book ID",
      });
    }

    if (error.code === "23505") {
      return res.status(409).json({
        success: false,
        message: "Barcode already exists",
      });
    }

    if (error.code === "23503") {
      return res.status(409).json({
        success: false,
        message: "Book does not exist or cannot be assigned",
      });
    }

    if (error.code === "23514") {
      return res.status(400).json({
        success: false,
        message: "Invalid book copy data",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to create book copy",
    });
  }
};

const updateBookCopy = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      bookId,
      barcode,
      status,
      condition,
      shelfLocation,
      acquisitionDate,
    } = req.body;

    if (!bookId || !barcode || !barcode.trim() || !status) {
      return res.status(400).json({
        success: false,
        message: "Book ID, barcode and status are required",
      });
    }

    const existingBookCopy = await bookCopyModel.getBookCopyById(id);

    if (!existingBookCopy) {
      return res.status(404).json({
        success: false,
        message: "Book copy not found",
      });
    }

    await bookCopyModel.updateBookCopy(id, {
      bookId,
      barcode: barcode.trim(),
      status,
      condition,
      shelfLocation,
      acquisitionDate,
    });

    const updatedBookCopy = await bookCopyModel.getBookCopyById(id);

    res.status(200).json({
      success: true,
      message: "Book copy updated successfully",
      data: updatedBookCopy,
    });
  } catch (error) {
    console.error("Update book copy error:", error);

    if (error.code === "22P02") {
      return res.status(400).json({
        success: false,
        message: "Invalid book ID",
      });
    }

    if (error.code === "23505") {
      return res.status(409).json({
        success: false,
        message: "Barcode already exists",
      });
    }

    if (error.code === "23503") {
      return res.status(409).json({
        success: false,
        message: "Book does not exist or cannot be assigned",
      });
    }

    if (error.code === "23514") {
      return res.status(400).json({
        success: false,
        message: "Invalid book copy data",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to update book copy",
    });
  }
};

const deleteBookCopy = async (req, res) => {
  try {
    const { id } = req.params;

    const bookCopy = await bookCopyModel.getBookCopyById(id);

    if (!bookCopy) {
      return res.status(404).json({
        success: false,
        message: "Book copy not found",
      });
    }

    await bookCopyModel.deleteBookCopy(id);

    res.status(200).json({
      success: true,
      message: "Book copy deleted successfully",
    });
  } catch (error) {
    console.error("Delete book copy error:", error);

    if (error.code === "22P02") {
      return res.status(400).json({
        success: false,
        message: "Invalid book copy ID",
      });
    }

    if (error.code === "23503") {
      return res.status(409).json({
        success: false,
        message:
          "Cannot delete this book copy because it is referenced by other records",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to delete book copy",
    });
  }
};

module.exports = {
  getAllBookCopies,
  getBookCopyById,
  createBookCopy,
  updateBookCopy,
  deleteBookCopy,
};