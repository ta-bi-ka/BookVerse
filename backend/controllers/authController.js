const bcrypt = require("bcrypt");

const {
  findStudentRole,
  findUserByUsernameOrEmail,
  createUser,
} = require("../models/authModel");

const register = async (req, res) => {
  try {
    const { fullName, username, email, password, phone } = req.body;

    if (!fullName || !username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Full name, username, email and password are required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    const studentRole = await findStudentRole();

    if (!studentRole) {
      return res.status(500).json({
        success: false,
        message: "Student role is not configured",
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await createUser({
      roleId: studentRole.role_id,
      fullName: fullName.trim(),
      username: username.trim(),
      email: email.trim().toLowerCase(),
      passwordHash,
      phone: phone ? phone.trim() : null,
    });

    return res.status(201).json({
      success: true,
      message: "Registration successful",
      data: user,
    });
  } catch (error) {
    console.error("Registration error:", error);

    if (error.code === "23505") {
      return res.status(409).json({
        success: false,
        message: "Username or email already exists",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Registration failed",
    });
  }
};

const login = async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message: "Username/email and password are required",
      });
    }

    const user = await findUserByUsernameOrEmail(identifier.trim());

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid username/email or password",
      });
    }

    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: "Your account is inactive",
      });
    }

    const passwordMatches = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message: "Invalid username/email or password",
      });
    }

    req.session.regenerate((error) => {
      if (error) {
        console.error("Session regeneration error:", error);

        return res.status(500).json({
          success: false,
          message: "Login failed",
        });
      }

      req.session.userId = user.user_id;
      req.session.roleId = user.role_id;
      req.session.roleName = user.role_name;

      req.session.save((saveError) => {
        if (saveError) {
          console.error("Session save error:", saveError);

          return res.status(500).json({
            success: false,
            message: "Login failed",
          });
        }

        return res.status(200).json({
          success: true,
          message: "Login successful",
          data: {
            userId: user.user_id,
            fullName: user.full_name,
            username: user.username,
            email: user.email,
            role: user.role_name,
          },
        });
      });
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      success: false,
      message: "Login failed",
    });
  }
};

const logout = (req, res) => {
  req.session.destroy((error) => {
    if (error) {
      console.error("Logout error:", error);

      return res.status(500).json({
        success: false,
        message: "Logout failed",
      });
    }

    res.clearCookie("connect.sid");

    return res.status(200).json({
      success: true,
      message: "Logout successful",
    });
  });
};

const getSession = (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({
      success: false,
      message: "Not authenticated",
    });
  }

  return res.status(200).json({
    success: true,
    data: {
      userId: req.session.userId,
      roleId: req.session.roleId,
      roleName: req.session.roleName,
    },
  });
};

module.exports = {
  register,
  login,
  logout,
  getSession,
};