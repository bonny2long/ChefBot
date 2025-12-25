// src/utils/getRecipeFromClaude.js (Ready for Deployment)
// Use environment variable for API URL, fallback to localhost for development
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api/recipes";
const CLAUDE_MODEL = "claude-3-5-sonnet-20241022"; // Upgraded model for faster, better responses

// Simple in-memory cache for recent recipes
const recipeCache = new Map();
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

const chefDialogs = [
  "Bonjour! I'm Chef BonBon, and I'm ready to whip up a storm with your ingredients!",
  "Hey there, foodie! Chef BonBon here to sizzle some magic—let's get cooking!",
  "Greetings, culinary adventurer! Chef BonBon will transform your ingredients into a masterpiece!",
  "Salutations! This is Chef BonBon, your kitchen wizard, ready to conjure a delicious dish!",
  "Well, well! Chef BonBon has arrived to turn your ingredients into a flavor explosion!",
  "Ahoy, chef-in-training! Chef BonBon's here to stir up something spectacular!",
  "Hello, my friend! Chef BonBon is about to dazzle you with a tasty creation!",
  "Step right up! Chef BonBon is in the house, ready to cook up a feast!",
  "Ooh la la! Chef BonBon will whisk you away with this delightful recipe!",
  "Rise and shine! Chef BonBon's here to spice up your day with a yummy dish!"
];

function getRandomDialog(userName = null) {
  const dialog = chefDialogs[Math.floor(Math.random() * chefDialogs.length)];
  return userName ? dialog.replace(/friend|foodie|chef-in-training/, userName) : dialog;
}

export async function getRecipeFromClaude(ingredients, userName = null, cookingMethod = 'any') {
  // Create cache key from sorted ingredients to handle order variations
  const cacheKey = [...ingredients].sort().join(',').toLowerCase() + `-${cookingMethod}`;
  
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

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        ingredients: ingredients,
        cookingMethod: cookingMethod
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("API Error Response:", errorData);
      throw new Error(`API error: ${response.status} ${response.statusText} - ${errorData.error || 'Unknown error'}`);
    }

    const result = await response.json();
    
    // Handle the case where cooking method is needed
    if (result.needsCookingMethod) {
      // Return a special response that your UI can handle
      return {
        needsCookingMethod: true,
        recipeType: result.recipeType,
        message: "Please select a cooking method for your food recipe."
      };
    }

    // Extract recipe text from your API's response format
    let recipeText = '';
    
    if (result.recipe?.content && Array.isArray(result.recipe.content)) {
      // Handle Claude API response format
      recipeText = result.recipe.content
        .filter(item => item.type === 'text')
        .map(item => item.text)
        .join('\n');
    } else if (typeof result.recipe === 'string') {
      // Handle plain string response
      recipeText = result.recipe;
    } else {
      console.error("Unexpected API response structure:", result);
      throw new Error("Failed to extract recipe from API response.");
    }

    if (!recipeText) {
      throw new Error("Empty recipe received from API.");
    }

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
    
  } catch (error) {
    console.error("Error generating recipe:", error);
    throw error;
  }
}
