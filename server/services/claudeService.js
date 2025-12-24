import fetch from 'node-fetch';

const CLAUDE_API_URL = process.env.CLAUDE_API_URL || 'https://api.anthropic.com/v1/messages';

export const generateRecipe = async (prompt, apiKey) => {
  if (!prompt) {
    throw new Error('Prompt is required.');
  }
  if (!apiKey) {
    throw new Error('Anthropic API Key is missing.');
  }

  const response = await fetch(CLAUDE_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514', // Claude Sonnet 4 (latest)
      max_tokens: 2048,
      temperature: 0.9,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    })
  });

  const data = await response.json();

  if (!response.ok) {
    const errorMessage = data.error?.message || 'Unknown error from Claude API';
    throw new Error(`Claude API error: ${errorMessage}`);
  }

  return data;
};
