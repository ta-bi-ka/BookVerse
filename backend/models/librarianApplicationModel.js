const { pool } = require("../config/db");

const getPendingApplications = async () => {
  const result = await pool.query(
    `
    SELECT
      a.application_id,
      a.user_id,
      u.full_name,
      u.username,
      u.email,
      a.status,
      a.requested_on
    FROM librarian_applications a
    JOIN users u ON u.user_id = a.user_id
    WHERE a.status = 'pending'
    ORDER BY a.requested_on, a.application_id
    `
  );

  return result.rows;
};

const findActiveAdmin = async (client, userId) => {
  const result = await client.query(
    `
    SELECT u.user_id
    FROM users u
    JOIN roles r ON r.role_id = u.role_id
    WHERE u.user_id = $1
      AND u.is_active = TRUE
      AND r.role_name = 'Admin'
    FOR SHARE OF u
    `,
    [userId]
  );

  return result.rows[0];
};

const lockApplication = async (client, applicationId) => {
  const result = await client.query(
    `
    SELECT
      a.application_id,
      a.user_id,
      a.status,
      u.is_active,
      r.role_name
    FROM librarian_applications a
    JOIN users u ON u.user_id = a.user_id
    JOIN roles r ON r.role_id = u.role_id
    WHERE a.application_id = $1
    FOR UPDATE OF a, u
    `,
    [applicationId]
  );

  return result.rows[0];
};

const promoteToLibrarian = async (client, userId) => {
  const result = await client.query(
    `
    UPDATE users u
    SET
      role_id = r.role_id,
      last_updated_on = CURRENT_TIMESTAMP
    FROM roles r
    WHERE u.user_id = $1
      AND r.role_name = 'Librarian'
    RETURNING u.user_id
    `,
    [userId]
  );

  return result.rows[0];
};

const markApplicationApproved = async (
  client,
  applicationId,
  adminId
) => {
  const result = await client.query(
    `
    UPDATE librarian_applications
    SET
      status = 'approved',
      reviewed_by = $2,
      reviewed_on = CURRENT_TIMESTAMP
    WHERE application_id = $1
      AND status = 'pending'
    RETURNING *
    `,
    [applicationId, adminId]
  );

  return result.rows[0];
};

const markApplicationDeclined = async (
  client,
  applicationId,
  adminId,
  reason
) => {
  const result = await client.query(
    `
    UPDATE librarian_applications
    SET
      status = 'declined',
      reviewed_by = $2,
      reviewed_on = CURRENT_TIMESTAMP,
      decision_reason = $3
    WHERE application_id = $1
      AND status = 'pending'
    RETURNING *
    `,
    [applicationId, adminId, reason]
  );

  return result.rows[0];
};
module.exports = {
  getPendingApplications,
  findActiveAdmin,
  lockApplication,
  promoteToLibrarian,
  markApplicationApproved,
  markApplicationDeclined,
};