const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export async function getRecipeFromClaude(
  ingredients,
  cookingMethod = null,
  type = null
) {
  const response = await fetch(`${API_URL}/recipes`, {
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
