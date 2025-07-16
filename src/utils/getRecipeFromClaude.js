// src/utils/getRecipeFromClaude.js

// Use the proxy server URL instead of the Anthropic API URL
const API_URL = "http://localhost:3000/claude-proxy";
const CLAUDE_MODEL = "claude-3-sonnet-20240229"; // A good balance model

export async function getRecipeFromClaude(ingredients) {
  const prompt = `You are Chef BonBon, an AI chef. Generate a creative and detailed recipe using only the following ingredients: ${ingredients.join(', ')}. Provide a recipe name, a list of ingredients with quantities, and step-by-step instructions. If an ingredient is unusual, suggest a common substitute. Make it delicious and easy to follow.`;

  console.log("Sending prompt to proxy:", prompt);

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Proxy API Error Response:", errorData);
      throw new Error(`Proxy API error: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`);
    }

    const result = await response.json();
    if (result.content && result.content.length > 0 && result.content[0].type === 'text') {
      return result.content[0].text;
    } else {
      console.error("Unexpected proxy response structure:", result);
      throw new Error("Failed to extract recipe from proxy response.");
    }

  } catch (error) {
    console.error("Error generating recipe from proxy:", error);
    throw error;
  }
}