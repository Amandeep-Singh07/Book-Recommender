import express from "express";
import { registerUser, loginUser, updateUser, changePassword } from "./auth.js";
import { isAuthenticated } from "./authMiddleware.js";

const router = express.Router();

// Register a new user
router.post("/register", async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Validate request body
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // Register user
    const result = await registerUser({ email, password, name });

    if (!result.success) {
      return res.status(400).json(result);
    }

    // Return success response
    return res.status(201).json(result);
  } catch (error) {
    console.error("Registration route error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error during registration",
      error: error.message,
    });
  }
});

// Login user
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate request body
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // Login user
    const result = await loginUser({ email, password });

    if (!result.success) {
      return res.status(401).json(result);
    }

    // Set token in cookie if login successful
    res.cookie("token", result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    });

    // Return success response
    return res.status(200).json(result);
  } catch (error) {
    console.error("Login route error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error during login",
      error: error.message,
    });
  }
});

// Logout user
router.post("/logout", (req, res) => {
  // Clear the token cookie
  res.clearCookie("token");

  return res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
});

// Get current user profile
router.get("/profile", isAuthenticated, async (req, res) => {
  try {
    // User is already attached to req by the isAuthenticated middleware
    return res.status(200).json({
      success: true,
      user: req.user,
    });
  } catch (error) {
    console.error("Profile route error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error getting profile",
      error: error.message,
    });
  }
});

// Update user profile
router.put("/profile", isAuthenticated, async (req, res) => {
  try {
    const { name, email } = req.body;

    // Update user
    const result = await updateUser(req.userId, { name, email });

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error("Update profile route error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error updating profile",
      error: error.message,
    });
  }
});

// Change password
router.post("/change-password", isAuthenticated, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Validate request body
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password and new password are required",
      });
    }

    // Change password
    const result = await changePassword(req.userId, {
      currentPassword,
      newPassword,
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error("Change password route error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error changing password",
      error: error.message,
    });
  }
});

export default router;
