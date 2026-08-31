const express = require("express");

const {
    getMyProfile,
    updateMyProfile,
    changePassword,
} = require("../controllers/profileController");

const {
    requireAuth,
} = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", requireAuth, getMyProfile);

router.put("/", requireAuth, updateMyProfile);

router.patch(
    "/password",
    requireAuth,
    changePassword
);

module.exports = router;