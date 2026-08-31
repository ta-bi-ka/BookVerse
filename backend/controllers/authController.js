const bcrypt = require("bcrypt");

const {
  findStudentRole,
  findUserByUsernameOrEmail,
  createUser,
} = require("../models/authModel");

const register = async (req, res) => {
  try {
    const { fullName, username, email, password, phone } = req.body;

    if (
  typeof fullName !== "string" ||
  typeof username !== "string" ||
  typeof email !== "string" ||
  typeof password !== "string" ||
  !fullName.trim() ||
  !username.trim() ||
  !email.trim() ||
  !password.trim()
) {
  return res.status(400).json({
    success: false,
    message: "Full name, username, email and password are required",
  });
}

if (password.length < 6 || password.length > 72) {
  return res.status(400).json({
    success: false,
    message: "Password must contain between 6 and 72 characters",
  });
}

if (
  fullName.trim().length > 100 ||
  username.trim().length > 50 ||
  email.trim().length > 100
) {
  return res.status(400).json({
    success: false,
    message: "One or more registration fields are too long",
  });
}

if (!/^[A-Za-z0-9_]+$/.test(username.trim())) {
  return res.status(400).json({
    success: false,
    message: "Username may contain only letters, numbers and underscores",
  });
}

if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
  return res.status(400).json({
    success: false,
    message: "A valid email address is required",
  });
}

if (
  phone !== undefined &&
  phone !== null &&
  typeof phone !== "string"
) {
  return res.status(400).json({
    success: false,
    message: "Phone must be provided as text",
  });
}

if (typeof phone === "string" && phone.trim().length > 20) {
  return res.status(400).json({
    success: false,
    message: "Phone number is too long",
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

    if (
  typeof identifier !== "string" ||
  typeof password !== "string" ||
  !identifier.trim() ||
  !password.trim()
) {
  return res.status(400).json({
    success: false,
    message: "Username/email and password are required",
  });
}

if (identifier.trim().length > 100 || password.length > 72) {
  return res.status(400).json({
    success: false,
    message: "Login input is too long",
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