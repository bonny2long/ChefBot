const DEFAULT_API_BASE = 'http://localhost:3000/api';
const rawApiUrl = import.meta.env.VITE_API_URL || DEFAULT_API_BASE;

// Normalize so we don't accidentally hit /recipes/recipes when the env var already includes the route
const normalizedBase = rawApiUrl.replace(/\/+$/, '');
const RECIPES_ENDPOINT = normalizedBase.endsWith('/recipes')
  ? normalizedBase
  : `${normalizedBase}/recipes`;

export async function getRecipeFromClaude(
  ingredients,
  cookingMethod = null,
  type = null
) {
  const response = await fetch(RECIPES_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      ingredients,
      cookingMethod,
      type
    })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || 'Failed to fetch recipe');
  }

  return await response.json();
}
