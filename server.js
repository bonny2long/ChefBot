// server.js (Ready for Railway Deployment - ES Modules)
import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import 'dotenv/config'; // Crucial for Railway to load environment variables

const app = express();
const PORT = process.env.PORT || 3000; // Use Railway's PORT environment variable

// Ensure these are correctly loaded from Railway's environment variables
const CLAUDE_API_URL = process.env.CLAUDE_API_URL || 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

// Debug logging for Railway deployment
console.log('Railway Debug: API Key loaded:', ANTHROPIC_API_KEY ? 'YES' : 'NO');
if (ANTHROPIC_API_KEY) {
  console.log('Railway Debug: API Key prefix:', ANTHROPIC_API_KEY.substring(0, 10) + '...');
}

// Define a regex for allowed origins to include main domain and deploy previews
// This regex matches:
// - https://chefbonbon.netlify.app
// - https://<any-subdomain>--chefbonbon.netlify.app (e.g., deploy previews)
const allowedOriginRegex = /^https:\/\/(?:[a-zA-Z0-9-]+\.)?chefbonbon\.netlify\.app$/;

// CORS middleware with dynamic origin checking using regex
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    // Allow localhost for development
    if (origin && origin.startsWith('http://localhost:')) {
      return callback(null, true);
    }

    // Check if the origin matches our allowed regex
    if (allowedOriginRegex.test(origin)) {
      callback(null, true); // Allow the origin
    } else {
      // Block other origins and provide a helpful message
      const msg = `The CORS policy for this site does not allow access from the specified Origin: ${origin}. Allowed pattern: ${allowedOriginRegex}`;
      callback(new Error(msg), false);
    }
  }
}));

app.use(express.json());

// Claude Proxy Endpoint
app.post('/claude-proxy', async (req, res) => {
  try {
    const userPrompt = req.body.prompt;
    if (!userPrompt) {
      return res.status(400).json({ error: 'Prompt is required.' });
    }

    const response = await fetch(CLAUDE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514', // Claude Sonnet 4 (latest)
        max_tokens: 2048, // Increased for more detailed recipes
        temperature: 0.9, // Higher temperature for more creative, faster responses
        messages: [
          {
            role: 'user',
            content: userPrompt
          }
        ]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Railway Server: Claude API returned non-OK response:", response.status, response.statusText, data);
      const errorMessage = data.error?.message || 'Unknown error from Claude API';
      return res.status(response.status).json({ error: 'Claude API error', details: errorMessage });
    }

    // Claude's API returns { content: [{ type: 'text', text: '...' }] }
    // We pass the raw data directly back to the frontend for it to extract
    return res.json(data);

  } catch (err) {
    console.error('Railway Server: Error in /claude-proxy:', err);
    res.status(500).json({ error: 'Internal Server Error', details: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Railway Server is running on port ${PORT}`);
});
