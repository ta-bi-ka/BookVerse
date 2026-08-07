const genreModel = require("../models/genreModel");

const getAllGenres = async (req, res) => {
  try {
    const genres = await genreModel.getAllGenres();

    res.status(200).json({
      success: true,
      count: genres.length,
      data: genres,
    });
  } catch (error) {
    console.error("Get genres error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch genres",
    });
  }
};

const getGenreById = async (req, res) => {
  try {
    const { id } = req.params;

    const genre = await genreModel.getGenreById(id);

    if (!genre) {
      return res.status(404).json({
        success: false,
        message: "Genre not found",
      });
    }

    res.status(200).json({
      success: true,
      data: genre,
    });
  } catch (error) {
    console.error("Get genre error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch genre",
    });
  }
};

const createGenre = async (req, res) => {
  try {
    const { genreName, description } = req.body;

    if (!genreName || !genreName.trim()) {
      return res.status(400).json({
        success: false,
        message: "Genre name is required",
      });
    }

    const genre = await genreModel.createGenre({
      genreName: genreName.trim(),
      description,
    });

    res.status(201).json({
      success: true,
      message: "Genre created successfully",
      data: genre,
    });
  } catch (error) {
    console.error("Create genre error:", error);

    if (error.code === "23505") {
      return res.status(409).json({
        success: false,
        message: "Genre already exists",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to create genre",
    });
  }
};

const updateGenre = async (req, res) => {
  try {
    const { id } = req.params;
    const { genreName, description } = req.body;

    if (!genreName || !genreName.trim()) {
      return res.status(400).json({
        success: false,
        message: "Genre name is required",
      });
    }

    const existingGenre = await genreModel.getGenreById(id);

    if (!existingGenre) {
      return res.status(404).json({
        success: false,
        message: "Genre not found",
      });
    }

    const updatedGenre = await genreModel.updateGenre(id, {
      genreName: genreName.trim(),
      description,
    });

    res.status(200).json({
      success: true,
      message: "Genre updated successfully",
      data: updatedGenre,
    });
  } catch (error) {
    console.error("Update genre error:", error);

    if (error.code === "23505") {
      return res.status(409).json({
        success: false,
        message: "Genre already exists",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to update genre",
    });
  }
};

const deleteGenre = async (req, res) => {
  try {
    const { id } = req.params;

    const genre = await genreModel.getGenreById(id);

    if (!genre) {
      return res.status(404).json({
        success: false,
        message: "Genre not found",
      });
    }

    await genreModel.deleteGenre(id);

    res.status(200).json({
      success: true,
      message: "Genre deleted successfully",
    });
  } catch (error) {
    console.error("Delete genre error:", error);

    if (error.code === "23503") {
      return res.status(409).json({
        success: false,
        message:
          "Cannot delete this genre because it is assigned to a book",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to delete genre",
    });
  }
};

module.exports = {
  getAllGenres,
  getGenreById,
  createGenre,
  updateGenre,
  deleteGenre,
};