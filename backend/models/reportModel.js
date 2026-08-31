const { pool } = require("../config/db");

const getOverview = async () => {
    const result = await pool.query(`
    SELECT
      (SELECT COUNT(*)::integer FROM users) AS total_users,
      (SELECT COUNT(*)::integer FROM books) AS total_books,
      (SELECT COUNT(*)::integer FROM book_copies) AS total_copies,

      (
        SELECT COUNT(*)::integer
        FROM book_copies
        WHERE status = 'available'
      ) AS available_copies,

      (
        SELECT COUNT(*)::integer
        FROM vw_active_borrows
      ) AS active_borrows,

      (
        SELECT COUNT(*)::integer
        FROM fines
        WHERE payment_date IS NULL
      ) AS unpaid_fines,

      COALESCE(
        (
          SELECT SUM(amount)
          FROM fines
          WHERE payment_date IS NULL
        ),
        0
      )::numeric(10, 2) AS unpaid_fine_amount,

      (SELECT COUNT(*)::integer FROM reviews) AS total_reviews
  `);

    return result.rows[0];
};

const getBookCatalog = async () => {
    const result = await pool.query(`
    SELECT *
    FROM vw_book_catalog
    ORDER BY title
  `);

    return result.rows;
};

const getActiveBorrows = async () => {
    const result = await pool.query(`
    SELECT *
    FROM vw_active_borrows
    ORDER BY due_date
  `);

    return result.rows;
};

const getFineSummary = async () => {
    const result = await pool.query(`
    SELECT *
    FROM vw_user_fine_summary
    ORDER BY user_id
  `);

    return result.rows;
};

const getBookStatistics = async () => {
    const result = await pool.query(`
    SELECT *
    FROM vw_book_statistics
    ORDER BY title
  `);

    return result.rows;
};

const getAuditLogs = async () => {
    const result = await pool.query(`
    SELECT
      a.log_id,
      a.user_id,
      u.username,
      a.action,
      a.table_name,
      a.record_id,
      a.action_time
    FROM audit_logs a
    LEFT JOIN users u
      ON u.user_id = a.user_id
    ORDER BY a.action_time DESC, a.log_id DESC
    LIMIT 200
  `);

    return result.rows;
};

const getProcedureLogs = async () => {
    const result = await pool.query(`
    SELECT
      p.call_log_id,
      p.user_id,
      u.username,
      p.procedure_name,
      p.execution_time,
      p.status
    FROM procedure_call_logs p
    LEFT JOIN users u
      ON u.user_id = p.user_id
    ORDER BY p.execution_time DESC, p.call_log_id DESC
    LIMIT 200
  `);

    return result.rows;
};

module.exports = {
    getOverview,
    getBookCatalog,
    getActiveBorrows,
    getFineSummary,
    getBookStatistics,
    getAuditLogs,
    getProcedureLogs,
};