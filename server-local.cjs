// server-local.cjs - Local development server
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch').default;
require('dotenv').config({ path: '.env.local' });

const app = express();
const PORT = 3000;

// Allow all origins for local development
app.use(cors());
app.use(express.json());

app.post('/claude-proxy', async (req, res) => {
  try {
    const userPrompt = req.body.prompt;
    if (!userPrompt) {
      return res.status(400).json({ error: 'Prompt is required.' });
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 1024,
        temperature: 0.7,
        messages: [{ role: 'user', content: userPrompt }]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Claude API error:", response.status, data);
      return res.status(response.status).json({ 
        error: 'Claude API error', 
        details: data.error?.message || 'Unknown error'
      });
    }

    // Return full Claude response format: { content: [{ type: 'text', text: '...' }] }
    res.json(data);

  } catch (err) {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Internal Server Error', details: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Local dev server running on http://localhost:${PORT}`);
  console.log(`API Key loaded: ${process.env.ANTHROPIC_API_KEY ? 'YES' : 'NO'}`);
});