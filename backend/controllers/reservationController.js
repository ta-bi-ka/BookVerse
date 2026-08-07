const reservationModel = require("../models/reservationModel");
const reservationService = require("../services/reservationService");

const createReservation = async (req, res) => {
  try {
    const { bookId } = req.body;

    if (!bookId) {
      return res.status(400).json({
        success: false,
        message: "bookId is required",
      });
    }

    const reservation =
      await reservationService.createReservation(
        req.session.userId,
        bookId
      );

    res.status(201).json({
      success: true,
      message: "Book reserved successfully",
      data: reservation,
    });
  } catch (error) {
    console.error("Create reservation error:", error);

    res.status(error.statusCode || 500).json({
      success: false,
      message:
        error.message || "Failed to create reservation",
    });
  }
};

const getMyReservations = async (req, res) => {
  try {
    const reservations =
      await reservationModel.getMyReservations(
        req.session.userId
      );

    res.status(200).json({
      success: true,
      count: reservations.length,
      data: reservations,
    });
  } catch (error) {
    console.error("Get reservations error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch reservations",
    });
  }
};

const getAllReservations = async (req, res) => {
  try {
    const reservations =
      await reservationModel.getAllReservations();

    res.status(200).json({
      success: true,
      count: reservations.length,
      data: reservations,
    });
  } catch (error) {
    console.error("Get all reservations error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch reservations",
    });
  }
};

const cancelReservation = async (req, res) => {
  try {
    const { id } = req.params;

    const reservation =
      await reservationService.cancelReservation(
        id,
        req.session.userId,
        req.session.roleName
      );

    res.status(200).json({
      success: true,
      message: "Reservation cancelled successfully",
      data: reservation,
    });
  } catch (error) {
    console.error("Cancel reservation error:", error);

    res.status(error.statusCode || 500).json({
      success: false,
      message:
        error.message || "Failed to cancel reservation",
    });
  }
};

const fulfillReservation = async (req, res) => {
  try {
    const { id } = req.params;

    const reservation =
      await reservationService.fulfillReservation(id);

    res.status(200).json({
      success: true,
      message: "Reservation fulfilled successfully",
      data: reservation,
    });
  } catch (error) {
    console.error("Fulfill reservation error:", error);

    res.status(error.statusCode || 500).json({
      success: false,
      message:
        error.message || "Failed to fulfill reservation",
    });
  }
};

module.exports = {
  createReservation,
  getMyReservations,
  getAllReservations,
  cancelReservation,
  fulfillReservation,
};