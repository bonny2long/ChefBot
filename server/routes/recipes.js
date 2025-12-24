import express from 'express';
import { generateRecipe } from '../services/claudeService.js';

const router = express.Router();

router.post('/claude-proxy', async (req, res) => {
  try {
    const userPrompt = req.body.prompt;
    const apiKey = process.env.ANTHROPIC_API_KEY;

    // Debug logging
    console.log('Railway Debug: API Key loaded:', apiKey ? 'YES' : 'NO');
    if (apiKey) {
      console.log('Railway Debug: API Key prefix:', apiKey.substring(0, 10) + '...');
    }

    const data = await generateRecipe(userPrompt, apiKey);
    return res.json(data);

  } catch (err) {
    console.error('Railway Server: Error in /claude-proxy:', err);
    // Distinguish between client errors (400) and server errors (500) if possible, 
    // but for now we'll return 500 or 400 based on the message if we want, 
    // or just 500 as in the original code (mostly).
    // The original code returned response.status if fetch failed.
    // Here we throw an error. I'll just return 500 with the message.
    res.status(500).json({ error: 'Internal Server Error', details: err.message });
  }
});

export default router;
