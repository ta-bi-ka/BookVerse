const express = require("express");

const {
    getPublicShelves,
    getMyShelves,
    getShelfById,
    createShelf,
    updateShelf,
    deleteShelf,
    getShelfItems,
    addBookToShelf,
    removeBookFromShelf,
} = require("../controllers/bookshelfController");

const {
    requireAuth,
    requireRole,
} = require("../middleware/authMiddleware");

const {
    validatePositiveIntegerParam,
} = require("../middleware/validationMiddleware");

const router = express.Router();

const validateShelfId = validatePositiveIntegerParam(
    "id",
    "bookshelf ID"
);

const validateBookId = validatePositiveIntegerParam(
    "bookId",
    "book ID"
);

router.get("/public", getPublicShelves);

router.get(
    "/my",
    requireAuth,
    requireRole("Student"),
    getMyShelves
);

router.post(
    "/",
    requireAuth,
    requireRole("Student"),
    createShelf
);

router.get(
    "/:id",
    validateShelfId,
    getShelfById
);

router.put(
    "/:id",
    requireAuth,
    requireRole("Student"),
    validateShelfId,
    updateShelf
);

router.delete(
    "/:id",
    requireAuth,
    requireRole("Student"),
    validateShelfId,
    deleteShelf
);

router.get(
    "/:id/books",
    validateShelfId,
    getShelfItems
);

router.post(
    "/:id/books",
    requireAuth,
    requireRole("Student"),
    validateShelfId,
    addBookToShelf
);

router.delete(
    "/:id/books/:bookId",
    requireAuth,
    requireRole("Student"),
    validateShelfId,
    validateBookId,
    removeBookFromShelf
);

module.exports = router;