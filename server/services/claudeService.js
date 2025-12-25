import fetch from 'node-fetch';

const CLAUDE_API_URL =
  process.env.CLAUDE_API_URL || 'https://api.anthropic.com/v1/messages';

export const generateRecipeText = async (prompt, apiKey) => {
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
      temperature: 0.7,
      messages: [{ role: 'user', content: prompt }]
    })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message || 'Claude API error');
  }

  const text = data?.content?.[0]?.text;
  if (!text) throw new Error('Claude returned no text');

  return text;
};

export const detectRecipeIntent = async (ingredients, apiKey) => {
  const prompt = `
Ingredients:
${ingredients.join(', ')}

Is this FOOD or a DRINK?
Respond with one word only.
`;

  const text = await generateRecipeText(prompt, apiKey);
  const intent = text.trim().toLowerCase();

  if (!['food', 'drink'].includes(intent)) {
    throw new Error(`Invalid intent: ${intent}`);
  }

  return intent;
};
