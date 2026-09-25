const { pool } = require("../config/db");
const applicationModel =
  require("../models/librarianApplicationModel");

const createError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const approveApplication = async (applicationId, adminId) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Check the reviewer's current database role.
    const admin = await applicationModel.findActiveAdmin(
      client,
      adminId
    );

    if (!admin) {
      throw createError("An active Admin account is required", 403);
    }

    // Lock the application and applicant until the decision is saved.
    const application = await applicationModel.lockApplication(
      client,
      applicationId
    );

    if (!application) {
      throw createError("Application not found", 404);
    }

    if (application.status !== "pending") {
      throw createError("This application has already been reviewed", 409);
    }

    if (Number(application.user_id) === Number(adminId)) {
      throw createError("You cannot approve your own application", 403);
    }

    if (!application.is_active) {
      throw createError("The applicant's account is inactive", 409);
    }

    if (application.role_name !== "Student") {
      throw createError("The applicant must currently be a Student", 409);
    }

    const promotedUser = await applicationModel.promoteToLibrarian(
      client,
      application.user_id
    );

    if (!promotedUser) {
      throw new Error("Librarian role is not configured");
    }

    const approvedApplication =
      await applicationModel.markApplicationApproved(
        client,
        applicationId,
        adminId
      );

    if (!approvedApplication) {
      throw createError("This application has already been reviewed", 409);
    }

    await client.query("COMMIT");

    return approvedApplication;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

const declineApplication = async (
  applicationId,
  adminId,
  reason
) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const admin = await applicationModel.findActiveAdmin(
      client,
      adminId
    );

    if (!admin) {
      throw createError("An active Admin account is required", 403);
    }

    const application = await applicationModel.lockApplication(
      client,
      applicationId
    );

    if (!application) {
      throw createError("Application not found", 404);
    }

    if (application.status !== "pending") {
      throw createError("This application has already been reviewed", 409);
    }

    if (Number(application.user_id) === Number(adminId)) {
      throw createError("You cannot review your own application", 403);
    }

    if (application.role_name !== "Student") {
      throw createError("The applicant must currently be a Student", 409);
    }

    const declinedApplication =
      await applicationModel.markApplicationDeclined(
        client,
        applicationId,
        adminId,
        reason
      );

    if (!declinedApplication) {
      throw createError("This application has already been reviewed", 409);
    }

    await client.query("COMMIT");

    return declinedApplication;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};
module.exports = {
  approveApplication,
  declineApplication,
};