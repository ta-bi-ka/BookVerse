const adminModel = require("../models/adminModel");

const getAllUsers = async (req, res) => {
  try {
    const users = await adminModel.getAllUsers();

    return res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    console.error("Get users error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch users",
    });
  }
};

const changeUserRole = async (req, res) => {
  try {
    const userId = Number(req.params.id);
    const { roleName } = req.body;

    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(400).json({
        success: false,
        message: "A valid user ID is required",
      });
    }

    if (typeof roleName !== "string" || !roleName.trim()) {
      return res.status(400).json({
        success: false,
        message: "Role name is required",
      });
    }

    const existingUser = await adminModel.getUserById(userId);

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const role = await adminModel.findRoleByName(roleName.trim());

    if (!role) {
      return res.status(400).json({
        success: false,
        message: "The requested role does not exist",
      });
    }

    if (
      userId === Number(req.session.userId) &&
      role.role_name !== "Admin"
    ) {
      return res.status(409).json({
        success: false,
        message: "You cannot remove your own Admin role",
      });
    }

    await adminModel.updateUserRole(userId, role.role_id);

    const updatedUser = await adminModel.getUserById(userId);

    return res.status(200).json({
      success: true,
      message: "User role updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    console.error("Change user role error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update user role",
    });
  }
};

module.exports = {
  getAllUsers,
  changeUserRole,
};