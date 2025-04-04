// import express from "express";
// import cors from "cors";
// import OpenAI from "openai";
// import dotenv from "dotenv";

// dotenv.config(); // Load API key from .env file

// const app = express();
// app.use(cors());
// app.use(express.json());

// // NVIDIA AI API Config
// const openai = new OpenAI({
//   apiKey: process.env.NVIDIA_API_KEY, // Store API key in .env file
//   baseURL: "https://integrate.api.nvidia.com/v1",
// });

// app.post("/get-response", async (req, res) => {
//   try {
//     const { prompt } = req.body;

//     const completion = await openai.chat.completions.create({
//       model: "nvidia/llama-3.1-nemotron-70b-instruct",
//       messages: [{ role: "user", content: prompt }],
//       temperature: 0.5,
//       top_p: 1,
//       max_tokens: 1024,
//       stream: false, // Change to true if streaming responses
//     });

//     res.json({
//       response: completion.choices[0]?.message?.content || "No response",
//     });
//   } catch (error) {
//     console.error("Error fetching response:", error);
//     res.status(500).json({ error: "Failed to fetch response from NVIDIA AI" });
//   }
// });

// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

import express from "express";
import cors from "cors";
import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config(); // Load API key from .env file

const app = express();
app.use(express.static("public"));
app.use(cors());
app.use(express.json());
app.use(express.static("public")); // Serve static files from 'public' directory

// NVIDIA AI API Config
const openai = new OpenAI({
  apiKey: process.env.NVIDIA_API_KEY, // Store API key in .env file
  baseURL: "https://integrate.api.nvidia.com/v1",
});

app.get("/", async (req, res) => {
  res.sendFile("id.html", { root: "./" });
});

app.post("/get-response", async (req, res) => {
  try {
    const { prompt } = req.body;

    const completion = await openai.chat.completions.create({
      model: "nvidia/llama-3.1-nemotron-70b-instruct",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7, // Slightly higher temperature for more variety in recommendations
      top_p: 0.9,
      max_tokens: 1500, // Increased token limit for detailed recommendations
      stream: false,
    });

    res.json({
      response: completion.choices[0]?.message?.content || "No response",
    });
  } catch (error) {
    console.error("Error fetching response:", error);
    res.status(500).json({ error: "Failed to fetch response from NVIDIA AI" });
  }
});

// Add a route for book data if you want to include a database later
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
  console.log(`Book Recommender server running on port ${PORT}`)
);
