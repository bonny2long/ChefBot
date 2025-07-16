// server.js
import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Debugging log: Check if the API key is loaded
console.log("Server starting. ANTHROPIC_API_KEY from .env:", process.env.ANTHROPIC_API_KEY ? process.env.ANTHROPIC_API_KEY.substring(0, 5) + '...' : 'Not set or undefined');


const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON request bodies
app.use(express.json());

// Configure CORS to allow requests from your React app's origin
app.use(cors({
  origin: 'http://localhost:5173'
}));

// Claude API endpoint
const CLAUDE_API_URL = "https://api.anthropic.com/v1/messages";
const CLAUDE_MODEL = "claude-3-5-sonnet-20241022"; // ✅ correct format with dashes



// Proxy endpoint for Claude API
app.post('/claude-proxy', async (req, res) => {
  const anthropicApiKey = process.env.ANTHROPIC_API_KEY;

  if (!anthropicApiKey) {
    console.error("Anthropic API Key is not set in server's .env file.");
    return res.status(500).json({ error: "Server error: Anthropic API Key not configured." });
  }

  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: "Prompt is required." });
  }

  try {
    const response = await fetch(CLAUDE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicApiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        max_tokens: 1024,
        messages: [
          { role: "user", content: prompt }
        ]
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Claude API Error from proxy:", errorData);
      // Ensure we forward the original status code from Claude
      return res.status(response.status).json(errorData);
    }

    const result = await response.json();
    res.json(result);

  } catch (error) {
    console.error("Proxy server error when calling Claude API:", error);
    res.status(500).json({ error: "Internal server error when processing Claude API request." });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Proxy server running on http://localhost:${PORT}`);
  console.log("Remember to start your React development server (npm run dev) separately.");
});
