const express = require("express");

const {
    getOverview,
    getBookCatalog,
    getActiveBorrows,
    getFineSummary,
    getBookStatistics,
    getAuditLogs,
    getProcedureLogs,
} = require("../controllers/reportController");

const {
    requireAuth,
    requireRole,
} = require("../middleware/authMiddleware");

const router = express.Router();

router.use(requireAuth);

router.get(
    "/overview",
    requireRole("Admin", "Librarian"),
    getOverview
);

router.get(
    "/book-catalog",
    requireRole("Admin", "Librarian"),
    getBookCatalog
);

router.get(
    "/active-borrows",
    requireRole("Admin", "Librarian"),
    getActiveBorrows
);

router.get(
    "/fine-summary",
    requireRole("Admin", "Librarian"),
    getFineSummary
);

router.get(
    "/book-statistics",
    requireRole("Admin", "Librarian"),
    getBookStatistics
);

router.get(
    "/audit-logs",
    requireRole("Admin"),
    getAuditLogs
);

router.get(
    "/procedure-logs",
    requireRole("Admin"),
    getProcedureLogs
);

module.exports = router;