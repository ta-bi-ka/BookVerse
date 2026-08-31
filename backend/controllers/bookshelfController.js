const bookshelfModel = require("../models/bookshelfModel");

const isPositiveInteger = (value) => {
    const number = Number(value);
    return Number.isInteger(number) && number > 0;
};

const canViewShelf = (shelf, userId) => {
    return (
        shelf.visibility === "public" ||
        Number(shelf.user_id) === Number(userId)
    );
};

const getPublicShelves = async (req, res) => {
    try {
        const shelves = await bookshelfModel.getPublicShelves();

        return res.status(200).json({
            success: true,
            count: shelves.length,
            data: shelves,
        });
    } catch (error) {
        console.error("Get public shelves error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve public bookshelves",
        });
    }
};

const getMyShelves = async (req, res) => {
    try {
        const shelves = await bookshelfModel.getUserShelves(
            req.session.userId
        );

        return res.status(200).json({
            success: true,
            count: shelves.length,
            data: shelves,
        });
    } catch (error) {
        console.error("Get my shelves error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve your bookshelves",
        });
    }
};

const getShelfById = async (req, res) => {
    try {
        const shelfId = Number(req.params.id);
        const shelf = await bookshelfModel.getShelfById(shelfId);

        if (!shelf) {
            return res.status(404).json({
                success: false,
                message: "Bookshelf not found",
            });
        }

        if (!canViewShelf(shelf, req.session.userId)) {
            return res.status(403).json({
                success: false,
                message: "You cannot view this private bookshelf",
            });
        }

        const items = await bookshelfModel.getShelfItems(shelfId);

        return res.status(200).json({
            success: true,
            data: {
                ...shelf,
                items,
            },
        });
    } catch (error) {
        console.error("Get bookshelf error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve bookshelf",
        });
    }
};

const createShelf = async (req, res) => {
    try {
        const body = req.body || {};
        const { shelfName, description } = body;
        const visibility = body.visibility ?? "private";

        if (
            typeof shelfName !== "string" ||
            !shelfName.trim()
        ) {
            return res.status(400).json({
                success: false,
                message: "Shelf name is required",
            });
        }

        if (shelfName.trim().length > 100) {
            return res.status(400).json({
                success: false,
                message: "Shelf name cannot exceed 100 characters",
            });
        }

        if (
            description !== undefined &&
            description !== null &&
            typeof description !== "string"
        ) {
            return res.status(400).json({
                success: false,
                message: "Description must be provided as text",
            });
        }

        if (
            typeof description === "string" &&
            description.trim().length > 255
        ) {
            return res.status(400).json({
                success: false,
                message: "Description cannot exceed 255 characters",
            });
        }

        if (
            typeof visibility !== "string" ||
            !["private", "public"].includes(
                visibility.trim().toLowerCase()
            )
        ) {
            return res.status(400).json({
                success: false,
                message: "Visibility must be private or public",
            });
        }

        const shelf = await bookshelfModel.createShelf({
            userId: req.session.userId,
            shelfName: shelfName.trim(),
            description:
                typeof description === "string" && description.trim()
                    ? description.trim()
                    : null,
            visibility: visibility.trim().toLowerCase(),
        });

        return res.status(201).json({
            success: true,
            message: "Bookshelf created successfully",
            data: shelf,
        });
    } catch (error) {
        console.error("Create bookshelf error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to create bookshelf",
        });
    }
};

const updateShelf = async (req, res) => {
    try {
        const shelfId = Number(req.params.id);
        const shelf = await bookshelfModel.getShelfById(shelfId);

        if (!shelf) {
            return res.status(404).json({
                success: false,
                message: "Bookshelf not found",
            });
        }

        if (Number(shelf.user_id) !== Number(req.session.userId)) {
            return res.status(403).json({
                success: false,
                message: "You can update only your own bookshelf",
            });
        }

        const body = req.body || {};
        const hasShelfName = Object.prototype.hasOwnProperty.call(
            body,
            "shelfName"
        );
        const hasDescription = Object.prototype.hasOwnProperty.call(
            body,
            "description"
        );
        const hasVisibility = Object.prototype.hasOwnProperty.call(
            body,
            "visibility"
        );

        if (!hasShelfName && !hasDescription && !hasVisibility) {
            return res.status(400).json({
                success: false,
                message: "Provide at least one field to update",
            });
        }

        if (
            hasShelfName &&
            (typeof body.shelfName !== "string" ||
                !body.shelfName.trim())
        ) {
            return res.status(400).json({
                success: false,
                message: "Shelf name must be non-empty text",
            });
        }

        if (
            hasShelfName &&
            body.shelfName.trim().length > 100
        ) {
            return res.status(400).json({
                success: false,
                message: "Shelf name cannot exceed 100 characters",
            });
        }

        if (
            hasDescription &&
            body.description !== null &&
            typeof body.description !== "string"
        ) {
            return res.status(400).json({
                success: false,
                message: "Description must be text or null",
            });
        }

        if (
            hasDescription &&
            typeof body.description === "string" &&
            body.description.trim().length > 255
        ) {
            return res.status(400).json({
                success: false,
                message: "Description cannot exceed 255 characters",
            });
        }

        if (
            hasVisibility &&
            (typeof body.visibility !== "string" ||
                !["private", "public"].includes(
                    body.visibility.trim().toLowerCase()
                ))
        ) {
            return res.status(400).json({
                success: false,
                message: "Visibility must be private or public",
            });
        }

        const updatedShelf = await bookshelfModel.updateShelf(
            shelfId,
            {
                shelfName: hasShelfName
                    ? body.shelfName.trim()
                    : shelf.shelf_name,
                description: hasDescription
                    ? typeof body.description === "string" &&
                        body.description.trim()
                        ? body.description.trim()
                        : null
                    : shelf.description,
                visibility: hasVisibility
                    ? body.visibility.trim().toLowerCase()
                    : shelf.visibility,
            }
        );

        return res.status(200).json({
            success: true,
            message: "Bookshelf updated successfully",
            data: updatedShelf,
        });
    } catch (error) {
        console.error("Update bookshelf error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to update bookshelf",
        });
    }
};

const deleteShelf = async (req, res) => {
    try {
        const shelfId = Number(req.params.id);
        const shelf = await bookshelfModel.getShelfById(shelfId);

        if (!shelf) {
            return res.status(404).json({
                success: false,
                message: "Bookshelf not found",
            });
        }

        if (Number(shelf.user_id) !== Number(req.session.userId)) {
            return res.status(403).json({
                success: false,
                message: "You can delete only your own bookshelf",
            });
        }

        await bookshelfModel.deleteShelf(shelfId);

        return res.status(200).json({
            success: true,
            message: "Bookshelf deleted successfully",
        });
    } catch (error) {
        console.error("Delete bookshelf error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to delete bookshelf",
        });
    }
};

const getShelfItems = async (req, res) => {
    try {
        const shelfId = Number(req.params.id);
        const shelf = await bookshelfModel.getShelfById(shelfId);

        if (!shelf) {
            return res.status(404).json({
                success: false,
                message: "Bookshelf not found",
            });
        }

        if (!canViewShelf(shelf, req.session.userId)) {
            return res.status(403).json({
                success: false,
                message: "You cannot view this private bookshelf",
            });
        }

        const items = await bookshelfModel.getShelfItems(shelfId);

        return res.status(200).json({
            success: true,
            count: items.length,
            data: items,
        });
    } catch (error) {
        console.error("Get bookshelf items error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve bookshelf items",
        });
    }
};

const addBookToShelf = async (req, res) => {
    try {
        const shelfId = Number(req.params.id);
        const bookId = Number(req.body?.bookId);

        if (!isPositiveInteger(bookId)) {
            return res.status(400).json({
                success: false,
                message: "A valid bookId is required",
            });
        }

        const shelf = await bookshelfModel.getShelfById(shelfId);

        if (!shelf) {
            return res.status(404).json({
                success: false,
                message: "Bookshelf not found",
            });
        }

        if (Number(shelf.user_id) !== Number(req.session.userId)) {
            return res.status(403).json({
                success: false,
                message: "You can modify only your own bookshelf",
            });
        }

        const book = await bookshelfModel.findBookById(bookId);

        if (!book) {
            return res.status(404).json({
                success: false,
                message: "Book not found",
            });
        }

        const existingItem = await bookshelfModel.findShelfItem(
            shelfId,
            bookId
        );

        if (existingItem) {
            return res.status(409).json({
                success: false,
                message: "This book is already on the bookshelf",
            });
        }

        const item = await bookshelfModel.addBookToShelf(
            shelfId,
            bookId
        );

        return res.status(201).json({
            success: true,
            message: "Book added to bookshelf successfully",
            data: {
                ...item,
                title: book.title,
            },
        });
    } catch (error) {
        console.error("Add book to bookshelf error:", error);

        if (error.code === "23505") {
            return res.status(409).json({
                success: false,
                message: "This book is already on the bookshelf",
            });
        }

        return res.status(500).json({
            success: false,
            message: "Failed to add book to bookshelf",
        });
    }
};

const removeBookFromShelf = async (req, res) => {
    try {
        const shelfId = Number(req.params.id);
        const bookId = Number(req.params.bookId);

        const shelf = await bookshelfModel.getShelfById(shelfId);

        if (!shelf) {
            return res.status(404).json({
                success: false,
                message: "Bookshelf not found",
            });
        }

        if (Number(shelf.user_id) !== Number(req.session.userId)) {
            return res.status(403).json({
                success: false,
                message: "You can modify only your own bookshelf",
            });
        }

        const removedItem =
            await bookshelfModel.removeBookFromShelf(
                shelfId,
                bookId
            );

        if (!removedItem) {
            return res.status(404).json({
                success: false,
                message: "Book is not present on this bookshelf",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Book removed from bookshelf successfully",
        });
    } catch (error) {
        console.error("Remove book from bookshelf error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to remove book from bookshelf",
        });
    }
};

module.exports = {
    getPublicShelves,
    getMyShelves,
    getShelfById,
    createShelf,
    updateShelf,
    deleteShelf,
    getShelfItems,
    addBookToShelf,
    removeBookFromShelf,
};