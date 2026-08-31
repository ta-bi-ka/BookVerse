const bcrypt = require("bcrypt");
const profileModel = require("../models/profileModel");

const getMyProfile = async (req, res) => {
    try {
        const profile = await profileModel.getUserProfile(
            req.session.userId
        );

        if (!profile) {
            return res.status(404).json({
                success: false,
                message: "User profile not found",
            });
        }

        return res.status(200).json({
            success: true,
            data: profile,
        });
    } catch (error) {
        console.error("Get profile error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve profile",
        });
    }
};

const updateMyProfile = async (req, res) => {
    try {
        const currentProfile =
            await profileModel.getUserProfile(
                req.session.userId
            );

        if (!currentProfile) {
            return res.status(404).json({
                success: false,
                message: "User profile not found",
            });
        }

        const body = req.body || {};

        const hasFullName = Object.prototype.hasOwnProperty.call(
            body,
            "fullName"
        );
        const hasUsername = Object.prototype.hasOwnProperty.call(
            body,
            "username"
        );
        const hasEmail = Object.prototype.hasOwnProperty.call(
            body,
            "email"
        );
        const hasPhone = Object.prototype.hasOwnProperty.call(
            body,
            "phone"
        );

        if (
            !hasFullName &&
            !hasUsername &&
            !hasEmail &&
            !hasPhone
        ) {
            return res.status(400).json({
                success: false,
                message: "Provide at least one profile field to update",
            });
        }

        const fullName = hasFullName
            ? body.fullName
            : currentProfile.full_name;

        const username = hasUsername
            ? body.username
            : currentProfile.username;

        const email = hasEmail
            ? body.email
            : currentProfile.email;

        const phone = hasPhone
            ? body.phone
            : currentProfile.phone;

        if (
            typeof fullName !== "string" ||
            !fullName.trim() ||
            fullName.trim().length > 100
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Full name is required and cannot exceed 100 characters",
            });
        }

        if (
            typeof username !== "string" ||
            !username.trim() ||
            username.trim().length > 50
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Username is required and cannot exceed 50 characters",
            });
        }

        if (
            !/^[A-Za-z0-9_]+$/.test(username.trim())
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Username may contain only letters, numbers and underscores",
            });
        }

        if (
            typeof email !== "string" ||
            !email.trim() ||
            email.trim().length > 100 ||
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
                email.trim()
            )
        ) {
            return res.status(400).json({
                success: false,
                message: "A valid email address is required",
            });
        }

        if (
            phone !== null &&
            phone !== undefined &&
            typeof phone !== "string"
        ) {
            return res.status(400).json({
                success: false,
                message: "Phone must be provided as text or null",
            });
        }

        if (
            typeof phone === "string" &&
            phone.trim().length > 20
        ) {
            return res.status(400).json({
                success: false,
                message: "Phone number cannot exceed 20 characters",
            });
        }

        const normalizedUsername = username.trim();
        const normalizedEmail = email
            .trim()
            .toLowerCase();

        const conflict =
            await profileModel.findProfileConflict(
                req.session.userId,
                normalizedUsername,
                normalizedEmail
            );

        if (conflict) {
            return res.status(409).json({
                success: false,
                message: "Username or email is already in use",
            });
        }

        const updatedProfile =
            await profileModel.updateUserProfile(
                req.session.userId,
                {
                    fullName: fullName.trim(),
                    username: normalizedUsername,
                    email: normalizedEmail,
                    phone:
                        typeof phone === "string" && phone.trim()
                            ? phone.trim()
                            : null,
                }
            );

        return res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            data: updatedProfile,
        });
    } catch (error) {
        console.error("Update profile error:", error);

        if (error.code === "23505") {
            return res.status(409).json({
                success: false,
                message: "Username or email is already in use",
            });
        }

        return res.status(500).json({
            success: false,
            message: "Failed to update profile",
        });
    }
};

const changePassword = async (req, res) => {
    try {
        const body = req.body || {};
        const { currentPassword, newPassword } = body;

        if (
            typeof currentPassword !== "string" ||
            typeof newPassword !== "string" ||
            !currentPassword ||
            !newPassword
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Current password and new password are required",
            });
        }

        if (
            currentPassword.length > 72 ||
            newPassword.length < 6 ||
            newPassword.length > 72
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "New password must contain between 6 and 72 characters",
            });
        }

        if (currentPassword === newPassword) {
            return res.status(400).json({
                success: false,
                message:
                    "New password must be different from the current password",
            });
        }

        const account = await profileModel.getUserAccount(
            req.session.userId
        );

        if (!account) {
            return res.status(404).json({
                success: false,
                message: "User account not found",
            });
        }

        const passwordMatches = await bcrypt.compare(
            currentPassword,
            account.password_hash
        );

        if (!passwordMatches) {
            return res.status(401).json({
                success: false,
                message: "Current password is incorrect",
            });
        }

        const passwordHash = await bcrypt.hash(
            newPassword,
            10
        );

        await profileModel.updateUserPassword(
            req.session.userId,
            passwordHash
        );

        return res.status(200).json({
            success: true,
            message: "Password changed successfully",
        });
    } catch (error) {
        console.error("Change password error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to change password",
        });
    }
};

module.exports = {
    getMyProfile,
    updateMyProfile,
    changePassword,
};