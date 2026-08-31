const express = require("express");

const {
    getAllFines,
    getMyFines,
    getFineById,
    createFine,
    updateFine,
    updateFinePayment,
    deleteFine,
} = require("../controllers/fineController");

const {
    requireAuth,
    requireRole,
} = require("../middleware/authMiddleware");

const {
    validatePositiveIntegerParam,
} = require("../middleware/validationMiddleware");

const router = express.Router();

const validateFineId = validatePositiveIntegerParam(
    "id",
    "fine ID"
);

router.get(
    "/",
    requireAuth,
    requireRole("Admin", "Librarian"),
    getAllFines
);

router.get(
    "/my",
    requireAuth,
    requireRole("Student"),
    getMyFines
);

router.post(
    "/",
    requireAuth,
    requireRole("Admin", "Librarian"),
    createFine
);

router.get(
    "/:id",
    requireAuth,
    requireRole("Admin", "Librarian", "Student"),
    validateFineId,
    getFineById
);

router.put(
    "/:id",
    requireAuth,
    requireRole("Admin", "Librarian"),
    validateFineId,
    updateFine
);

router.patch(
    "/:id/payment",
    requireAuth,
    requireRole("Admin", "Librarian"),
    validateFineId,
    updateFinePayment
);

router.delete(
    "/:id",
    requireAuth,
    requireRole("Admin"),
    validateFineId,
    deleteFine
);

module.exports = router;