import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fetch from "node-fetch"; // For making HTTP requests to Mistral API

dotenv.config(); // Load API key from .env file

const app = express();
app.use(express.static("public"));
app.use(cors());
app.use(express.json());

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

app.get("/", async (req, res) => {
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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`Book Recommender AI server running on port ${PORT}`)
);
