import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import 'dotenv/config'; // Loads .env file at startup

const app = express();
const PORT = process.env.PORT || 3000;
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
const CLAUDE_API_KEY = process.env.ANTHROPIC_API_KEY;

app.use(express.json());
app.use(cors({ origin: 'https://chefbonbon.netlify.app' }));

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
