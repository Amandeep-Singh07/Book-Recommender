import "dotenv/config"; // This loads environment variables right away
import express from "express";
import cors from "cors";
import fetch from "node-fetch"; // For making HTTP requests to Mistral API
import cookieParser from "cookie-parser";
import { connectToMongoDB } from "./auth.js";
import authRoutes from "./authRoutes.js";
import { optionalAuth } from "./authMiddleware.js";

// Create Express app
const app = express();
app.use(express.static("public"));
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

// Connect to MongoDB
let db, usersCollection;
connectToMongoDB()
  .then(({ db: database, usersCollection: collection }) => {
    console.log("MongoDB connected successfully");
    db = database;
    usersCollection = collection;
  })
  .catch((err) => console.error("MongoDB connection error:", err));

// Mistral AI API configuration
const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;
const MISTRAL_API_URL = "https://api.mistral.ai/v1/chat/completions";

// Make sure API key is available (remove in production)
console.log("Mistral API Key available:", !!MISTRAL_API_KEY);
app.use((req, res, next) => {
  const start = Date.now();

  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  if (Object.keys(req.body).length > 0) {
    console.log("Request Body:", req.body);
  }

  const originalJson = res.json;
  res.json = function (body) {
    try {
      const responseTime = Date.now() - start;
      console.log(
        `[${new Date().toISOString()}] Response Status: ${
          res.statusCode
        } - ${responseTime}ms`
      );
      if (body instanceof Error) {
        console.log("Response Error:", body.message);
      } else {
        console.log("Response Body:", body);
      }
      return originalJson.call(this, body);
    } catch (error) {
      console.error("Logging middleware error:", error);
      return originalJson.call(this, body);
    }
  };
  next();
});

// Authentication routes
app.use("/api/auth", authRoutes);

// Optional authentication middleware for routes that don't require authentication
app.use(optionalAuth);

app.get("/", async (req, res) => {
  res.sendFile("index.html", { root: "./" });
});

app.get("/index.html", async (req, res) => {
  res.sendFile("index.html", { root: "./" });
});

app.post("/get-response", async (req, res) => {
  try {
    const { prompt } = req.body;

    // Check if API key is available
    if (!MISTRAL_API_KEY) {
      throw new Error("MISTRAL_API_KEY is not set in environment variables");
    }

    console.log("Sending request to Mistral API...");
    const response = await fetch(MISTRAL_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${MISTRAL_API_KEY}`,
      },
      body: JSON.stringify({
        model: "mistral-large-latest", // You can change to other Mistral models
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        top_p: 0.9,
        max_tokens: 1500,
        stream: false,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("API Response status:", response.status);
      console.error("API Response error:", errorData);
      throw new Error(`Mistral API error: ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();

    res.json({
      response: data.choices[0]?.message?.content || "No response",
    });
  } catch (error) {
    console.error("Error fetching response:", error);
    res.status(500).json({ error: "Failed to fetch response from Mistral AI" });
  }
});

// Add a route for book data that could be integrated with a database later
app.get("/api/popular-books", (req, res) => {
  // This could be connected to a database in the future
  const popularBooks = [
    {
      title: "Project Hail Mary",
      author: "Andy Weir",
      genres: ["Science Fiction", "Adventure"],
      description: "A lone astronaut must save humanity from extinction.",
    },
    {
      title: "The Midnight Library",
      author: "Matt Haig",
      genres: ["Fiction", "Fantasy"],
      description:
        "A library between life and death offers infinite possibilities.",
    },
    // Add more popular books
  ];

  res.json(popularBooks);
});

// Protected route example that requires authentication
app.get("/api/user/reading-list", optionalAuth, (req, res) => {
  // If user is not authenticated, return public reading list
  if (!req.isAuthenticated) {
    return res.status(200).json({
      success: true,
      message: "Public reading list",
      readingList: [
        {
          title: "Sign in to see your personalized reading list",
          isPublic: true,
        },
      ],
    });
  }

  // If user is authenticated, return their reading list
  // In a real app, you would fetch this from the database
  const readingList = [
    {
      title: "The Hobbit",
      author: "J.R.R. Tolkien",
      addedAt: new Date(),
      completed: false,
    },
    {
      title: "Dune",
      author: "Frank Herbert",
      addedAt: new Date(Date.now() - 86400000), // yesterday
      completed: true,
    },
  ];

  return res.status(200).json({
    success: true,
    message: "User reading list",
    readingList,
    userName: req.user.name || req.user.email,
  });
});

// Add a test route to check MongoDB connection
app.get("/api/test-mongodb", async (req, res) => {
  try {
    if (db && usersCollection) {
      // Test the connection by making a simple query
      const count = await usersCollection.countDocuments();
      return res.json({
        success: true,
        message: "MongoDB connection is working",
        usersCount: count,
      });
    } else {
      return res.status(500).json({
        success: false,
        message: "MongoDB connection is not established",
      });
    }
  } catch (error) {
    console.error("MongoDB test error:", error);
    return res.status(500).json({
      success: false,
      message: "MongoDB test failed",
      error: error.message,
    });
  }
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () =>
  console.log(`Book Recommender AI server running on port ${PORT}`)
);
