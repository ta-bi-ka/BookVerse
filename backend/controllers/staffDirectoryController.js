const { pool } = require("../config/db");

const getStaffDirectory = async (req, res) => {
  try {
    const viewerResult = await pool.query(
      `
      SELECT r.role_name, u.is_active
      FROM users u
      JOIN roles r ON r.role_id = u.role_id
      WHERE u.user_id = $1
      `,
      [req.session.userId]
    );

    const viewer = viewerResult.rows[0];

    if (
      !viewer ||
      !viewer.is_active ||
      !["Admin", "Librarian"].includes(viewer.role_name)
    ) {
      return res.status(403).json({
        success: false,
        message: "Staff permission is required",
      });
    }

    const allowedRoles =
      viewer.role_name === "Admin"
        ? ["Librarian", "Student"]
        : ["Student"];

    const result = await pool.query(
      `
      SELECT
        u.user_id,
        u.full_name,
        u.username,
        u.is_active,
        r.role_name
      FROM users u
      JOIN roles r ON r.role_id = u.role_id
      WHERE r.role_name = ANY($1::text[])
      ORDER BY r.role_name, LOWER(u.full_name), u.user_id
      `,
      [allowedRoles]
    );

    return res.status(200).json({
      success: true,
      data: {
        viewerRole: viewer.role_name,
        librarians:
          viewer.role_name === "Admin"
            ? result.rows.filter(
                (user) => user.role_name === "Librarian"
              )
            : [],
        students: result.rows.filter(
          (user) => user.role_name === "Student"
        ),
      },
    });
  } catch (error) {
    console.error("Staff directory error:", error);

    return res.status(500).json({
      success: false,
      message: "Could not load the directory",
    });
  }
};

module.exports = { getStaffDirectory };