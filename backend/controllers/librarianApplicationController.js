const librarianApplicationModel =
  require("../models/librarianApplicationModel");
const applicationService =
  require("../services/librarianApplicationService");

const getPendingApplications = async (req, res) => {
  try {
    const applications =
      await librarianApplicationModel.getPendingApplications();

    res.set("Cache-Control", "no-store");

    return res.status(200).json({
      success: true,
      count: applications.length,
      data: applications,
    });
  } catch (error) {
    console.error("Get librarian applications error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load librarian applications",
    });
  }
};

const approveApplication = async (req, res) => {
  const applicationId = Number(req.params.id);

  if (
    !Number.isInteger(applicationId) ||
    applicationId <= 0 ||
    applicationId > 2147483647
  ) {
    return res.status(400).json({
      success: false,
      message: "A valid application ID is required",
    });
  }

  try {
    const application = await applicationService.approveApplication(
      applicationId,
      req.session.userId
    );

    return res.status(200).json({
      success: true,
      message: "Application approved. The account is now a Librarian.",
      data: application,
    });
  } catch (error) {
    console.error("Approve librarian application error:", error);

    const statusCode = [403, 404, 409].includes(error.statusCode)
      ? error.statusCode
      : 500;

    return res.status(statusCode).json({
      success: false,
      message:
        statusCode === 500
          ? "Failed to approve librarian application"
          : error.message,
    });
  }
};
const declineApplication = async (req, res) => {
  const applicationId = Number(req.params.id);
  const { reason = null } = req.body || {};

  if (
    !Number.isInteger(applicationId) ||
    applicationId <= 0 ||
    applicationId > 2147483647
  ) {
    return res.status(400).json({
      success: false,
      message: "A valid application ID is required",
    });
  }

  if (
    reason !== null &&
    (typeof reason !== "string" || reason.trim().length > 500)
  ) {
    return res.status(400).json({
      success: false,
      message: "Reason must be text with at most 500 characters",
    });
  }

  const normalizedReason =
    typeof reason === "string" ? reason.trim() || null : null;

  try {
    const application = await applicationService.declineApplication(
      applicationId,
      req.session.userId,
      normalizedReason
    );

    return res.status(200).json({
      success: true,
      message: "Application declined. The account remains a Student.",
      data: application,
    });
  } catch (error) {
    console.error("Decline librarian application error:", error);

    const statusCode = [403, 404, 409].includes(error.statusCode)
      ? error.statusCode
      : 500;

    return res.status(statusCode).json({
      success: false,
      message:
        statusCode === 500
          ? "Failed to decline librarian application"
          : error.message,
    });
  }
};
module.exports = {
  getPendingApplications,
  approveApplication,
  declineApplication,
};