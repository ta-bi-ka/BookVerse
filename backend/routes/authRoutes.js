const express = require("express");

const {
  register,
  login,
  logout,
  getSession,
} = require("../controllers/authController");

const { requireAuth } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", requireAuth, logout);
router.get("/session", requireAuth, getSession);

module.exports = router;