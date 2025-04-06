import { MongoClient, ObjectId } from "mongodb";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// Connect to MongoDB
let db = null;
let usersCollection = null;

async function connectToMongoDB() {
  try {
    // Get MongoDB connection URI from environment variable
    const mongoURI = process.env.MONGODB_URI;
    const jwtSecret = process.env.JWT_SECRET;

    console.log("Using MongoDB URI:", mongoURI);
    console.log("JWT Secret available:", !!jwtSecret);

    if (!mongoURI) {
      throw new Error("MONGODB_URI environment variable is not set");
    }

    // MongoDB connection options
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      connectTimeoutMS: 30000,
      socketTimeoutMS: 45000,
    };

    const client = new MongoClient(mongoURI, options);
    await client.connect();
    console.log("Connected to MongoDB");

    const dbName = mongoURI.includes("/")
      ? mongoURI.split("/").pop().split("?")[0]
      : "book_recommender";

    console.log("Using database:", dbName);

    db = client.db(dbName);
    usersCollection = db.collection("users");

    // Create unique index on email
    await usersCollection.createIndex({ email: 1 }, { unique: true });

    return { db, usersCollection };
  } catch (error) {
    console.error("MongoDB connection error:", error);
    throw error;
  }
}

// Register a new user
async function registerUser(userData) {
  try {
    const { email, password, name } = userData;

    // Check if user already exists
    const existingUser = await usersCollection.findOne({ email });
    if (existingUser) {
      return { success: false, message: "User with this email already exists" };
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user document
    const newUser = {
      email,
      password: hashedPassword,
      name: name || "",
      createdAt: new Date(),
      lastLogin: null,
    };

    // Insert user into database
    const result = await usersCollection.insertOne(newUser);

    // Return success without password
    const { password: _, ...userWithoutPassword } = newUser;
    return {
      success: true,
      message: "User registered successfully",
      user: userWithoutPassword,
      userId: result.insertedId,
    };
  } catch (error) {
    console.error("Registration error:", error);
    return {
      success: false,
      message: "Registration failed",
      error: error.message,
    };
  }
}

// Login user
async function loginUser(credentials) {
  try {
    const { email, password } = credentials;

    // Find user by email
    const user = await usersCollection.findOne({ email });
    if (!user) {
      return { success: false, message: "Invalid email or password" };
    }

    // Compare passwords
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return { success: false, message: "Invalid email or password" };
    }

    // Update last login
    await usersCollection.updateOne(
      { _id: user._id },
      { $set: { lastLogin: new Date() } }
    );

    // Get JWT Secret
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error("JWT_SECRET environment variable is not set");
    }

    // Generate JWT
    const token = jwt.sign({ userId: user._id, email: user.email }, jwtSecret, {
      expiresIn: "24h",
    });

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;

    return {
      success: true,
      message: "Login successful",
      user: userWithoutPassword,
      token,
    };
  } catch (error) {
    console.error("Login error:", error);
    return { success: false, message: "Login failed", error: error.message };
  }
}

// Verify JWT token
function verifyToken(token) {
  try {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error("JWT_SECRET environment variable is not set");
    }

    const decoded = jwt.verify(token, jwtSecret);
    return { success: true, userId: decoded.userId, email: decoded.email };
  } catch (error) {
    return { success: false, message: "Invalid token" };
  }
}

// Get user by ID
async function getUserById(userId) {
  try {
    const user = await usersCollection.findOne({ _id: new ObjectId(userId) });
    if (!user) {
      return { success: false, message: "User not found" };
    }

    // Return user without password
    const { password, ...userWithoutPassword } = user;
    return { success: true, user: userWithoutPassword };
  } catch (error) {
    console.error("Get user error:", error);
    return {
      success: false,
      message: "Failed to get user",
      error: error.message,
    };
  }
}

// Update user
async function updateUser(userId, updateData) {
  try {
    // Don't allow password updates through this function
    const { password, ...safeUpdateData } = updateData;

    const result = await usersCollection.updateOne(
      { _id: new ObjectId(userId) },
      { $set: safeUpdateData }
    );

    if (result.matchedCount === 0) {
      return { success: false, message: "User not found" };
    }

    return { success: true, message: "User updated successfully" };
  } catch (error) {
    console.error("Update user error:", error);
    return {
      success: false,
      message: "Failed to update user",
      error: error.message,
    };
  }
}

// Change password
async function changePassword(userId, { currentPassword, newPassword }) {
  try {
    // Get user with password
    const user = await usersCollection.findOne({ _id: new ObjectId(userId) });
    if (!user) {
      return { success: false, message: "User not found" };
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password
    );
    if (!isPasswordValid) {
      return { success: false, message: "Current password is incorrect" };
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    await usersCollection.updateOne(
      { _id: new ObjectId(userId) },
      { $set: { password: hashedPassword } }
    );

    return { success: true, message: "Password changed successfully" };
  } catch (error) {
    console.error("Change password error:", error);
    return {
      success: false,
      message: "Failed to change password",
      error: error.message,
    };
  }
}

export {
  connectToMongoDB,
  registerUser,
  loginUser,
  verifyToken,
  getUserById,
  updateUser,
  changePassword,
};
