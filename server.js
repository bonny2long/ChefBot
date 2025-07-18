import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import 'dotenv/config'; 

const app = express();
const PORT = process.env.PORT || 3000;
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
const CLAUDE_API_KEY = process.env.ANTHROPIC_API_KEY;

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

app.post('/claude-proxy', async (req, res) => {
    try {
        const { prompt } = req.body;
        if (!prompt) {
            return res.status(400).json({ error: 'Prompt is required.' });
        }

        const response = await fetch(CLAUDE_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': CLAUDE_API_KEY,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: 'claude-3-sonnet-20240229',
                max_tokens: 1000,
                messages: [{ role: 'user', content: prompt }]
            })
        });

        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Error in proxy:', error);
        res.status(500).json({ error: 'Failed to fetch from Anthropic API.' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
