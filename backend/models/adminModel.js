const { pool } = require("../config/db");

const getAllUsers = async () => {
  const result = await pool.query(`
    SELECT
      u.user_id,
      u.role_id,
      r.role_name,
      u.full_name,
      u.username,
      u.email,
      u.phone,
      u.is_active,
      u.created_on,
      u.last_updated_on
    FROM users u
    JOIN roles r
      ON u.role_id = r.role_id
    ORDER BY u.user_id
  `);

  return result.rows;
};

const getUserById = async (userId) => {
  const result = await pool.query(
    `
    SELECT
      u.user_id,
      u.role_id,
      r.role_name,
      u.full_name,
      u.username,
      u.email,
      u.phone,
      u.is_active,
      u.created_on,
      u.last_updated_on
    FROM users u
    JOIN roles r
      ON u.role_id = r.role_id
    WHERE u.user_id = $1
    `,
    [userId]
  );

  return result.rows[0];
};

const findRoleByName = async (roleName) => {
  const result = await pool.query(
    `
    SELECT role_id, role_name
    FROM roles
    WHERE LOWER(role_name) = LOWER($1)
    `,
    [roleName]
  );

  return result.rows[0];
};

const updateUserRole = async (userId, roleId) => {
  const result = await pool.query(
    `
    UPDATE users
    SET
      role_id = $2,
      last_updated_on = CURRENT_TIMESTAMP
    WHERE user_id = $1
    RETURNING user_id
    `,
    [userId, roleId]
  );

  return result.rows[0];
};

module.exports = {
  getAllUsers,
  getUserById,
  findRoleByName,
  updateUserRole,
};