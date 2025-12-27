import fetch from 'node-fetch';

const CLAUDE_API_URL =
  process.env.CLAUDE_API_URL || 'https://api.anthropic.com/v1/messages';

//=== Cache for recipe intents ===
const intentCache = new Map();
const INTENT_CACHE_TTL = 10 * 60 * 1000; // 10 minutes


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
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 1100,
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
  if (!Array.isArray(ingredients) || ingredients.length === 0) {
    throw new Error('Ingredients are required for intent detection.');
  }

  const cacheKey = ingredients
    .map(i => i.toLowerCase().trim())
    .sort()
    .join('|');

  // 🔥 Cache hit
  if (intentCache.has(cacheKey)) {
    const cached = intentCache.get(cacheKey);

    if (Date.now() - cached.timestamp < INTENT_CACHE_TTL) {
      return cached.intent;
    }

    // Expired entry
    intentCache.delete(cacheKey);
  }

  const prompt = `
You are classifying user intent.

Ingredients:
${ingredients.join(', ')}

Respond with exactly ONE word:
food or drink
`;

  const intent = await generateRecipeText(prompt, apiKey);

  const normalizedIntent = intent.trim().toLowerCase();

  if (!['food', 'drink'].includes(normalizedIntent)) {
    throw new Error(`Invalid intent response: ${intent}`);
  }

  //Save to cache
  intentCache.set(cacheKey, {
    intent: normalizedIntent,
    timestamp: Date.now()
  });

  return normalizedIntent;
};

