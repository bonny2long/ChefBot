// src/utils/getRecipeFromClaude.js (Ready for Deployment)

// Use environment variable for API URL, fallback to localhost for development
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/claude-proxy";
const CLAUDE_MODEL = "claude-3-5-sonnet-20241022"; // Upgraded model for faster, better responses

// Simple in-memory cache for recent recipes
const recipeCache = new Map();
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

const chefDialogs = [
  "Bonjour! I'm Chef BonBon, and I’m ready to whip up a storm with your ingredients!",
  "Hey there, foodie! Chef BonBon here to sizzle some magic—let’s get cooking!",
  "Greetings, culinary adventurer! Chef BonBon will transform your ingredients into a masterpiece!",
  "Salutations! This is Chef BonBon, your kitchen wizard, ready to conjure a delicious dish!",
  "Well, well! Chef BonBon has arrived to turn your ingredients into a flavor explosion!",
  "Ahoy, chef-in-training! Chef BonBon’s here to stir up something spectacular!",
  "Hello, my friend! Chef BonBon is about to dazzle you with a tasty creation!",
  "Step right up! Chef BonBon is in the house, ready to cook up a feast!",
  "Ooh la la! Chef BonBon will whisk you away with this delightful recipe!",
  "Rise and shine! Chef BonBon’s here to spice up your day with a yummy dish!"
];

function getRandomDialog(userName = null) {
  const dialog = chefDialogs[Math.floor(Math.random() * chefDialogs.length)];
  return userName ? dialog.replace(/friend|foodie|chef-in-training/, userName) : dialog;
}

export async function getRecipeFromClaude(ingredients, userName = null) {
  // Create cache key from sorted ingredients to handle order variations
  const cacheKey = [...ingredients].sort().join(',').toLowerCase();

  // Check cache first
  if (recipeCache.has(cacheKey)) {
    const cachedData = recipeCache.get(cacheKey);
    if (Date.now() - cachedData.timestamp < CACHE_DURATION) {
      // Return cached recipe with fresh dialog
      return `${getRandomDialog(userName)}\n\n${cachedData.recipe}`;
    } else {
      // Remove expired cache entry
      recipeCache.delete(cacheKey);
    }
  }

  const prompt = `As Chef BonBon, create a recipe using: ${ingredients.join(', ')}.

Format:
**Recipe Name**

**Ingredients:**
- [ingredient with quantity]

**Instructions:**
1. [step]

Keep it concise but complete. No substitutes unless essential.`;

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ prompt })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Proxy API Error Response:", errorData);
      throw new Error(`Proxy API error: ${response.status} ${response.statusText} - ${errorData.error || errorData.details?.message || 'Unknown error'}`);
    }

    const result = await response.json(); // This is the raw Claude response

    // Expect 'content' array from Claude's response (as sent by server.cjs)
    if (result.content && result.content.length > 0 && result.content[0].type === 'text') {
      const recipeText = result.content[0].text;

      // Cache the recipe (without the dialog)
      recipeCache.set(cacheKey, {
        recipe: recipeText,
        timestamp: Date.now()
      });

      // Clean up cache if it gets too large (keep last 50 recipes)
      if (recipeCache.size > 50) {
        const firstKey = recipeCache.keys().next().value;
        recipeCache.delete(firstKey);
      }

      return `${getRandomDialog(userName)}\n\n${recipeText}`;
    } else {
      console.error("Unexpected proxy response structure (missing 'content' array or text type):", result);
      throw new Error("Failed to extract recipe from proxy response.");
    }

  } catch (error) {
    console.error("Error generating recipe from proxy:", error);
    throw error;
  }
}
