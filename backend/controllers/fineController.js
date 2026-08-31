const fineModel = require("../models/fineModel");

const isPositiveInteger = (value) => {
    const number = Number(value);
    return Number.isInteger(number) && number > 0;
};

const normalizeAmount = (value) => {
    if (
        typeof value !== "number" &&
        typeof value !== "string"
    ) {
        return null;
    }

    const text = String(value).trim();

    if (!/^\d+(\.\d{1,2})?$/.test(text)) {
        return null;
    }

    const amount = Number(text);

    if (
        !Number.isFinite(amount) ||
        amount < 0 ||
        amount > 99999999.99
    ) {
        return null;
    }

    return amount;
};

const isValidISODate = (value) => {
    if (
        typeof value !== "string" ||
        !/^\d{4}-\d{2}-\d{2}$/.test(value)
    ) {
        return false;
    }

    const date = new Date(`${value}T00:00:00Z`);

    return (
        !Number.isNaN(date.getTime()) &&
        date.toISOString().slice(0, 10) === value
    );
};

const getAllFines = async (req, res) => {
    try {
        const fines = await fineModel.getAllFines();

        return res.status(200).json({
            success: true,
            count: fines.length,
            data: fines,
        });
    } catch (error) {
        console.error("Get all fines error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve fines",
        });
    }
};

const getMyFines = async (req, res) => {
    try {
        const fines = await fineModel.getUserFines(
            req.session.userId
        );

        const unpaidTotal = fines
            .filter((fine) => !fine.is_paid)
            .reduce(
                (total, fine) => total + Number(fine.amount),
                0
            );

        return res.status(200).json({
            success: true,
            count: fines.length,
            unpaidTotal: Number(unpaidTotal.toFixed(2)),
            data: fines,
        });
    } catch (error) {
        console.error("Get my fines error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve your fines",
        });
    }
};

const getFineById = async (req, res) => {
    try {
        const fineId = Number(req.params.id);
        const fine = await fineModel.getFineById(fineId);

        if (!fine) {
            return res.status(404).json({
                success: false,
                message: "Fine not found",
            });
        }

        if (
            req.session.roleName === "Student" &&
            Number(fine.user_id) !== Number(req.session.userId)
        ) {
            return res.status(403).json({
                success: false,
                message: "You can view only your own fines",
            });
        }

        return res.status(200).json({
            success: true,
            data: fine,
        });
    } catch (error) {
        console.error("Get fine error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve fine",
        });
    }
};

const createFine = async (req, res) => {
    try {
        const body = req.body || {};
        const borrowId = Number(body.borrowId);
        const amount = normalizeAmount(body.amount);
        const { reason } = body;

        if (!isPositiveInteger(borrowId)) {
            return res.status(400).json({
                success: false,
                message: "A valid borrowId is required",
            });
        }

        if (amount === null) {
            return res.status(400).json({
                success: false,
                message:
                    "Amount must be non-negative and contain at most two decimal places",
            });
        }

        if (
            typeof reason !== "string" ||
            !reason.trim()
        ) {
            return res.status(400).json({
                success: false,
                message: "Fine reason is required",
            });
        }

        if (reason.trim().length > 100) {
            return res.status(400).json({
                success: false,
                message: "Fine reason cannot exceed 100 characters",
            });
        }

        const borrow = await fineModel.getBorrowById(borrowId);

        if (!borrow) {
            return res.status(404).json({
                success: false,
                message: "Borrow record not found",
            });
        }

        const existingFine =
            await fineModel.getFineByBorrowId(borrowId);

        if (existingFine) {
            return res.status(409).json({
                success: false,
                message: "A fine already exists for this borrow",
            });
        }

        const fine = await fineModel.createFine({
            borrowId,
            amount,
            reason: reason.trim(),
        });

        return res.status(201).json({
            success: true,
            message: "Fine created successfully",
            data: fine,
        });
    } catch (error) {
        console.error("Create fine error:", error);

        if (error.code === "23505") {
            return res.status(409).json({
                success: false,
                message: "A fine already exists for this borrow",
            });
        }

        if (error.code === "23503") {
            return res.status(404).json({
                success: false,
                message: "Borrow record not found",
            });
        }

        return res.status(500).json({
            success: false,
            message: "Failed to create fine",
        });
    }
};

const updateFine = async (req, res) => {
    try {
        const fineId = Number(req.params.id);
        const currentFine = await fineModel.getFineById(fineId);

        if (!currentFine) {
            return res.status(404).json({
                success: false,
                message: "Fine not found",
            });
        }

        const body = req.body || {};
        const hasAmount = Object.prototype.hasOwnProperty.call(
            body,
            "amount"
        );
        const hasReason = Object.prototype.hasOwnProperty.call(
            body,
            "reason"
        );

        if (!hasAmount && !hasReason) {
            return res.status(400).json({
                success: false,
                message: "Provide amount or reason to update",
            });
        }

        const amount = hasAmount
            ? normalizeAmount(body.amount)
            : Number(currentFine.amount);

        if (amount === null) {
            return res.status(400).json({
                success: false,
                message:
                    "Amount must be non-negative and contain at most two decimal places",
            });
        }

        if (
            hasReason &&
            (typeof body.reason !== "string" ||
                !body.reason.trim())
        ) {
            return res.status(400).json({
                success: false,
                message: "Fine reason must be non-empty text",
            });
        }

        if (
            hasReason &&
            body.reason.trim().length > 100
        ) {
            return res.status(400).json({
                success: false,
                message: "Fine reason cannot exceed 100 characters",
            });
        }

        const fine = await fineModel.updateFine(fineId, {
            amount,
            reason: hasReason
                ? body.reason.trim()
                : currentFine.reason,
        });

        return res.status(200).json({
            success: true,
            message: "Fine updated successfully",
            data: fine,
        });
    } catch (error) {
        console.error("Update fine error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to update fine",
        });
    }
};

const updateFinePayment = async (req, res) => {
    try {
        const fineId = Number(req.params.id);
        const body = req.body || {};
        const { paid, paymentDate } = body;

        if (typeof paid !== "boolean") {
            return res.status(400).json({
                success: false,
                message: "Paid must be true or false",
            });
        }

        if (
            paid &&
            paymentDate !== undefined &&
            paymentDate !== null &&
            !isValidISODate(paymentDate)
        ) {
            return res.status(400).json({
                success: false,
                message: "Payment date must use YYYY-MM-DD format",
            });
        }

        const currentFine = await fineModel.getFineById(fineId);

        if (!currentFine) {
            return res.status(404).json({
                success: false,
                message: "Fine not found",
            });
        }

        const fine = paid
            ? await fineModel.markFinePaid(
                fineId,
                paymentDate ?? null
            )
            : await fineModel.markFineUnpaid(fineId);

        return res.status(200).json({
            success: true,
            message: paid
                ? "Fine marked as paid"
                : "Fine marked as unpaid",
            data: fine,
        });
    } catch (error) {
        console.error("Update fine payment error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to update fine payment",
        });
    }
};

const deleteFine = async (req, res) => {
    try {
        const fineId = Number(req.params.id);
        const fine = await fineModel.getFineById(fineId);

        if (!fine) {
            return res.status(404).json({
                success: false,
                message: "Fine not found",
            });
        }

        await fineModel.deleteFine(fineId);

        return res.status(200).json({
            success: true,
            message: "Fine deleted successfully",
        });
    } catch (error) {
        console.error("Delete fine error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to delete fine",
        });
    }
};

module.exports = {
    getAllFines,
    getMyFines,
    getFineById,
    createFine,
    updateFine,
    updateFinePayment,
    deleteFine,
};