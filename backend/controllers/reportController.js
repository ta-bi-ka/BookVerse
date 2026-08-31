const reportModel = require("../models/reportModel");

const createReportHandler = (reportName, getReportData) => {
    return async (req, res) => {
        try {
            const data = await getReportData();

            const response = {
                success: true,
                message: `${reportName} retrieved successfully`,
                data,
            };

            if (Array.isArray(data)) {
                response.count = data.length;
            }

            return res.status(200).json(response);
        } catch (error) {
            console.error(`${reportName} error:`, error);

            return res.status(500).json({
                success: false,
                message: `Failed to retrieve ${reportName.toLowerCase()}`,
            });
        }
    };
};

const getOverview = createReportHandler(
    "System overview",
    reportModel.getOverview
);

const getBookCatalog = createReportHandler(
    "Book catalog report",
    reportModel.getBookCatalog
);

const getActiveBorrows = createReportHandler(
    "Active borrows report",
    reportModel.getActiveBorrows
);

const getFineSummary = createReportHandler(
    "Fine summary report",
    reportModel.getFineSummary
);

const getBookStatistics = createReportHandler(
    "Book statistics report",
    reportModel.getBookStatistics
);

const getAuditLogs = createReportHandler(
    "Audit logs",
    reportModel.getAuditLogs
);

const getProcedureLogs = createReportHandler(
    "Procedure logs",
    reportModel.getProcedureLogs
);

module.exports = {
    getOverview,
    getBookCatalog,
    getActiveBorrows,
    getFineSummary,
    getBookStatistics,
    getAuditLogs,
    getProcedureLogs,
};