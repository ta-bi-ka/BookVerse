const bookModel = require("../models/bookModel");
const bookService = require("../services/bookService");

const getAllBooks = async (req, res) => {
  try {
    const books = await bookModel.getAllBooks();

    res.status(200).json({
      success: true,
      count: books.length,
      data: books,
    });
  } catch (error) {
    console.error("Get books error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch books",
    });
  }
};
const searchBooks = async (req, res) => {
  try {
    const {
      q,
      author,
      genre,
      publisher,
      available,
    } = req.query;

    const books = await bookModel.searchBooks({
      q,
      author,
      genre,
      publisher,
      available,
    });

    res.status(200).json({
      success: true,
      count: books.length,
      data: books,
    });
  } catch (error) {
    console.error("Search books error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to search books",
    });
  }
};

const getBookById = async (req, res) => {
  try {
    const { id } = req.params;

    const book = await bookModel.getBookById(id);

    if (!book) {
      return res.status(404).json({
        success: false,
        message: "Book not found",
      });
    }

    res.status(200).json({
      success: true,
      data: book,
    });
  } catch (error) {
    console.error("Get book error:", error);

    if (error.code === "22P02") {
      return res.status(400).json({
        success: false,
        message: "Invalid book ID",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to fetch book",
    });
  }
};

const createBook = async (req, res) => {
  try {
    const {
      publisherId,
      isbn,
      title,
      description,
      language,
      edition,
      publicationYear,
      totalPages,
      coverImage,
      authorIds,
      genreIds,
    } = req.body;

    if (!publisherId || !isbn || !isbn.trim() || !title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: "Publisher, ISBN and title are required",
      });
    }

    if (!Array.isArray(authorIds) || !Array.isArray(genreIds)) {
      return res.status(400).json({
        success: false,
        message: "authorIds and genreIds must be arrays",
      });
    }

    const book = await bookService.createBook({
      publisherId,
      isbn: isbn.trim(),
      title: title.trim(),
      description,
      language,
      edition,
      publicationYear,
      totalPages,
      coverImage,
      authorIds,
      genreIds,
    });

    res.status(201).json({
      success: true,
      message: "Book created successfully",
      data: book,
    });
  } catch (error) {
    console.error("Create book error:", error);

    if (error.code === "22P02") {
      return res.status(400).json({
        success: false,
        message: "Invalid book data",
      });
    }

    if (error.code === "23505") {
      return res.status(409).json({
        success: false,
        message: "Book already exists or ISBN already exists",
      });
    }

    if (error.code === "23503") {
      return res.status(409).json({
        success: false,
        message:
          "One or more related records do not exist or cannot be assigned",
      });
    }

    if (error.code === "23514") {
      return res.status(400).json({
        success: false,
        message: "Invalid book data",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to create book",
    });
  }
};

const updateBook = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      publisherId,
      isbn,
      title,
      description,
      language,
      edition,
      publicationYear,
      totalPages,
      coverImage,
      authorIds,
      genreIds,
    } = req.body;

    if (!publisherId || !isbn || !isbn.trim() || !title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: "Publisher, ISBN and title are required",
      });
    }

    if (!Array.isArray(authorIds) || !Array.isArray(genreIds)) {
      return res.status(400).json({
        success: false,
        message: "authorIds and genreIds must be arrays",
      });
    }

    const existingBook = await bookModel.getBookById(id);

    if (!existingBook) {
      return res.status(404).json({
        success: false,
        message: "Book not found",
      });
    }

    const updatedBook = await bookService.updateBook(id, {
      publisherId,
      isbn: isbn.trim(),
      title: title.trim(),
      description,
      language,
      edition,
      publicationYear,
      totalPages,
      coverImage,
      authorIds,
      genreIds,
    });

    res.status(200).json({
      success: true,
      message: "Book updated successfully",
      data: updatedBook,
    });
  } catch (error) {
    console.error("Update book error:", error);

    if (error.code === "22P02") {
      return res.status(400).json({
        success: false,
        message: "Invalid book data",
      });
    }

    if (error.code === "23505") {
      return res.status(409).json({
        success: false,
        message: "Book already exists or ISBN already exists",
      });
    }

    if (error.code === "23503") {
      return res.status(409).json({
        success: false,
        message:
          "One or more related records do not exist or cannot be assigned",
      });
    }

    if (error.code === "23514") {
      return res.status(400).json({
        success: false,
        message: "Invalid book data",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to update book",
    });
  }
};

const deleteBook = async (req, res) => {
  try {
    const { id } = req.params;

    const book = await bookModel.getBookById(id);

    if (!book) {
      return res.status(404).json({
        success: false,
        message: "Book not found",
      });
    }

    await bookService.deleteBook(id);

    res.status(200).json({
      success: true,
      message: "Book deleted successfully",
    });
  } catch (error) {
    console.error("Delete book error:", error);

    if (error.code === "22P02") {
      return res.status(400).json({
        success: false,
        message: "Invalid book ID",
      });
    }

    if (error.code === "23503") {
      return res.status(409).json({
        success: false,
        message:
          "Cannot delete this book because it is referenced by other records",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to delete book",
    });
  }
};

module.exports = {
  getAllBooks,
  getBookById,
  searchBooks,
  createBook,
  updateBook,
  deleteBook,
};