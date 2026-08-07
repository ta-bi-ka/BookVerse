const publisherModel = require("../models/publisherModel");

const getAllPublishers = async (req, res) => {
  try {
    const publishers = await publisherModel.getAllPublishers();

    res.status(200).json({
      success: true,
      count: publishers.length,
      data: publishers,
    });
  } catch (error) {
    console.error("Get publishers error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch publishers",
    });
  }
};

const getPublisherById = async (req, res) => {
  try {
    const { id } = req.params;

    const publisher = await publisherModel.getPublisherById(id);

    if (!publisher) {
      return res.status(404).json({
        success: false,
        message: "Publisher not found",
      });
    }

    res.status(200).json({
      success: true,
      data: publisher,
    });
  } catch (error) {
    console.error("Get publisher error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch publisher",
    });
  }
};

const createPublisher = async (req, res) => {
  try {
    const {
      publisherName,
      country,
      website,
    } = req.body;

    if (!publisherName || !publisherName.trim()) {
      return res.status(400).json({
        success: false,
        message: "Publisher name is required",
      });
    }

    const publisher = await publisherModel.createPublisher({
      publisherName: publisherName.trim(),
      country,
      website,
    });

    res.status(201).json({
      success: true,
      message: "Publisher created successfully",
      data: publisher,
    });
  } catch (error) {
    console.error("Create publisher error:", error);

    if (error.code === "23505") {
      return res.status(409).json({
        success: false,
        message: "Publisher already exists",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to create publisher",
    });
  }
};

const updatePublisher = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      publisherName,
      country,
      website,
    } = req.body;

    if (!publisherName || !publisherName.trim()) {
      return res.status(400).json({
        success: false,
        message: "Publisher name is required",
      });
    }

    const existingPublisher =
      await publisherModel.getPublisherById(id);

    if (!existingPublisher) {
      return res.status(404).json({
        success: false,
        message: "Publisher not found",
      });
    }

    const updatedPublisher =
      await publisherModel.updatePublisher(id, {
        publisherName: publisherName.trim(),
        country,
        website,
      });

    res.status(200).json({
      success: true,
      message: "Publisher updated successfully",
      data: updatedPublisher,
    });
  } catch (error) {
    console.error("Update publisher error:", error);

    if (error.code === "23505") {
      return res.status(409).json({
        success: false,
        message: "Publisher already exists",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to update publisher",
    });
  }
};

const deletePublisher = async (req, res) => {
  try {
    const { id } = req.params;

    const publisher =
      await publisherModel.getPublisherById(id);

    if (!publisher) {
      return res.status(404).json({
        success: false,
        message: "Publisher not found",
      });
    }

    await publisherModel.deletePublisher(id);

    res.status(200).json({
      success: true,
      message: "Publisher deleted successfully",
    });
  } catch (error) {
    console.error("Delete publisher error:", error);

    if (error.code === "23503") {
      return res.status(409).json({
        success: false,
        message:
          "Cannot delete this publisher because it is assigned to a book",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to delete publisher",
    });
  }
};

module.exports = {
  getAllPublishers,
  getPublisherById,
  createPublisher,
  updatePublisher,
  deletePublisher,
};