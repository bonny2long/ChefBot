import fetch from 'node-fetch';

const CLAUDE_API_URL =
  process.env.CLAUDE_API_URL || 'https://api.anthropic.com/v1/messages';

export const generateRecipe = async (prompt, apiKey) => {
  if (!prompt) throw new Error('Prompt is required.');
  if (!apiKey) throw new Error('Anthropic API Key is missing.');

  const response = await fetch(CLAUDE_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      temperature: 0.9,
      messages: [{ role: 'user', content: prompt }]
    })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message || 'Claude API error');
  }

  return data;
};

export const detectRecipeIntent = async (ingredients, apiKey) => {
  const prompt = `
You are classifying user intent.

Ingredients:
${ingredients.join(', ')}

Respond with exactly one word:
food or drink
`;

  const data = await generateRecipe(prompt, apiKey);

  const text = data?.content?.[0]?.text?.trim().toLowerCase();

  if (!['food', 'drink'].includes(text)) {
    throw new Error(`Invalid intent response: ${text}`);
  }

  return text;
};
