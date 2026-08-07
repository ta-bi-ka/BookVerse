const { pool } = require("../config/db");

const findStudentRole = async () => {
  const result = await pool.query(
    `SELECT role_id
     FROM roles
     WHERE role_name = $1`,
    ["Student"]
  );

  return result.rows[0];
};

const findUserByUsernameOrEmail = async (identifier) => {
  const result = await pool.query(
    `SELECT
        u.user_id,
        u.role_id,
        u.full_name,
        u.username,
        u.email,
        u.password_hash,
        u.phone,
        u.is_active,
        r.role_name
     FROM users u
     JOIN roles r ON u.role_id = r.role_id
     WHERE LOWER(u.email) = LOWER($1)
        OR LOWER(u.username) = LOWER($1)`,
    [identifier]
  );

  return result.rows[0];
};

const createUser = async ({
  roleId,
  fullName,
  username,
  email,
  passwordHash,
  phone,
}) => {
  const result = await pool.query(
    `INSERT INTO users
      (
        role_id,
        full_name,
        username,
        email,
        password_hash,
        phone,
        is_active
      )
     VALUES ($1, $2, $3, $4, $5, $6, TRUE)
     RETURNING
        user_id,
        role_id,
        full_name,
        username,
        email,
        phone,
        is_active,
        created_on`,
    [
      roleId,
      fullName,
      username,
      email,
      passwordHash,
      phone || null,
    ]
  );

  return result.rows[0];
};

module.exports = {
  findStudentRole,
  findUserByUsernameOrEmail,
  createUser,
};
