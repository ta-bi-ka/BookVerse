const authorModel = require("../models/authorModel");

const getAllAuthors = async (req, res) => {
  try {
    const authors = await authorModel.getAllAuthors();

    res.status(200).json({
      success: true,
      count: authors.length,
      data: authors,
    });
  } catch (error) {
    console.error("Get authors error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch authors",
    });
  }
};

const getAuthorById = async (req, res) => {
  try {
    const { id } = req.params;

    const author = await authorModel.getAuthorById(id);

    if (!author) {
      return res.status(404).json({
        success: false,
        message: "Author not found",
      });
    }

    res.status(200).json({
      success: true,
      data: author,
    });
  } catch (error) {
    console.error("Get author error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch author",
    });
  }
};

const createAuthor = async (req, res) => {
  try {
    const { authorName, nationality, biography } = req.body;

    if (!authorName || !authorName.trim()) {
      return res.status(400).json({
        success: false,
        message: "Author name is required",
      });
    }

    const author = await authorModel.createAuthor({
      authorName: authorName.trim(),
      nationality,
      biography,
    });

    res.status(201).json({
      success: true,
      message: "Author created successfully",
      data: author,
    });
  } catch (error) {
    console.error("Create author error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create author",
    });
  }
};

const updateAuthor = async (req, res) => {
  try {
    const { id } = req.params;
    const { authorName, nationality, biography } = req.body;

    if (!authorName || !authorName.trim()) {
      return res.status(400).json({
        success: false,
        message: "Author name is required",
      });
    }

    const existingAuthor = await authorModel.getAuthorById(id);

    if (!existingAuthor) {
      return res.status(404).json({
        success: false,
        message: "Author not found",
      });
    }

    const updatedAuthor = await authorModel.updateAuthor(id, {
      authorName: authorName.trim(),
      nationality,
      biography,
    });

    res.status(200).json({
      success: true,
      message: "Author updated successfully",
      data: updatedAuthor,
    });
  } catch (error) {
    console.error("Update author error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update author",
    });
  }
};

const deleteAuthor = async (req, res) => {
  try {
    const { id } = req.params;

    const author = await authorModel.getAuthorById(id);

    if (!author) {
      return res.status(404).json({
        success: false,
        message: "Author not found",
      });
    }

    await authorModel.deleteAuthor(id);

    res.status(200).json({
      success: true,
      message: "Author deleted successfully",
    });
  } catch (error) {
    console.error("Delete author error:", error);

    if (error.code === "23503") {
      return res.status(409).json({
        success: false,
        message:
          "Cannot delete this author because the author is assigned to a book",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to delete author",
    });
  }
};

module.exports = {
  getAllAuthors,
  getAuthorById,
  createAuthor,
  updateAuthor,
  deleteAuthor,
};