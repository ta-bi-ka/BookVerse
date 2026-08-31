const { pool } = require("../config/db");

const getUserProfile = async (userId) => {
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
      JOIN roles r ON r.role_id = u.role_id
      WHERE u.user_id = $1
    `,
        [userId]
    );

    return result.rows[0] || null;
};

const getUserAccount = async (userId) => {
    const result = await pool.query(
        `
      SELECT
        user_id,
        role_id,
        full_name,
        username,
        email,
        phone,
        password_hash,
        is_active
      FROM users
      WHERE user_id = $1
    `,
        [userId]
    );

    return result.rows[0] || null;
};

const findProfileConflict = async (
    userId,
    username,
    email
) => {
    const result = await pool.query(
        `
      SELECT user_id, username, email
      FROM users
      WHERE user_id <> $1
        AND (
          LOWER(username) = LOWER($2)
          OR LOWER(email) = LOWER($3)
        )
      LIMIT 1
    `,
        [userId, username, email]
    );

    return result.rows[0] || null;
};

const updateUserProfile = async (
    userId,
    { fullName, username, email, phone }
) => {
    const result = await pool.query(
        `
      UPDATE users
      SET
        full_name = $1,
        username = $2,
        email = $3,
        phone = $4,
        last_updated_on = CURRENT_TIMESTAMP
      WHERE user_id = $5
      RETURNING user_id
    `,
        [fullName, username, email, phone, userId]
    );

    if (result.rows.length === 0) {
        return null;
    }

    return getUserProfile(result.rows[0].user_id);
};

const updateUserPassword = async (
    userId,
    passwordHash
) => {
    const result = await pool.query(
        `
      UPDATE users
      SET
        password_hash = $1,
        last_updated_on = CURRENT_TIMESTAMP
      WHERE user_id = $2
      RETURNING user_id
    `,
        [passwordHash, userId]
    );

    return result.rows[0] || null;
};

module.exports = {
    getUserProfile,
    getUserAccount,
    findProfileConflict,
    updateUserProfile,
    updateUserPassword,
};