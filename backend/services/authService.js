const { pool } = require("../config/db");

const {
  createUser,
  createLibrarianApplication,
} = require("../models/authModel");

const registerAccount = async (
  userDetails,
  applyAsLibrarian = false
) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const user = await createUser(userDetails, client);

    const application = applyAsLibrarian
      ? await createLibrarianApplication(user.user_id, client)
      : null;

    await client.query("COMMIT");

    return { user, application };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  registerAccount,
};