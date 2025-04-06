import { verifyToken, getUserById } from "./auth.js";

// Middleware to check if the user is authenticated
export async function isAuthenticated(req, res, next) {
  try {
    // Get token from Authorization header or cookies
    let token = null;

    // Check Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    }

    // If no token in Authorization header, check cookies
    if (!token && req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    // If no token found, return unauthorized
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided.",
      });
    }

    // Verify token
    const decoded = verifyToken(token);
    if (!decoded.success) {
      return res.status(401).json({
        success: false,
        message: "Invalid token. Please log in again.",
      });
    }

    // Get user from database
    const userResult = await getUserById(decoded.userId);
    if (!userResult.success) {
      return res.status(401).json({
        success: false,
        message: "User not found. Please log in again.",
      });
    }

    // Add user info to request
    req.user = userResult.user;
    req.userId = decoded.userId;

    // Continue to next middleware or route handler
    next();
  } catch (error) {
    console.error("Authentication error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error during authentication",
    });
  }
}

// Optional middleware for routes that can have authenticated users but don't require it
export async function optionalAuth(req, res, next) {
  try {
    // Get token from Authorization header or cookies
    let token = null;

    // Check Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    }

    // If no token in Authorization header, check cookies
    if (!token && req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    // If no token found, continue without authentication
    if (!token) {
      req.isAuthenticated = false;
      return next();
    }

    // Verify token
    const decoded = verifyToken(token);
    if (!decoded.success) {
      req.isAuthenticated = false;
      return next();
    }

    // Get user from database
    const userResult = await getUserById(decoded.userId);
    if (!userResult.success) {
      req.isAuthenticated = false;
      return next();
    }

    // Add user info to request
    req.user = userResult.user;
    req.userId = decoded.userId;
    req.isAuthenticated = true;

    // Continue to next middleware or route handler
    next();
  } catch (error) {
    console.error("Optional auth error:", error);
    req.isAuthenticated = false;
    next();
  }
}
