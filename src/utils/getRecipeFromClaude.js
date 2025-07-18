// src/utils/getRecipeFromClaude.js

// Use the proxy server URL instead of the Anthropic API URL
const API_URL = "http://localhost:3000/claude-proxy";
const CLAUDE_MODEL = "claude-3-sonnet-20240229"; // A good balance model

// Array of random Chef BonBon dialogs
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
  "Rise and shine! Chef BonBon’s here to spice up your day with a yummy dish!",
];

// Function to get a random dialog
function getRandomDialog(userName = null) {
  const dialog = chefDialogs[Math.floor(Math.random() * chefDialogs.length)];
  return userName ? dialog.replace(/friend|foodie|chef-in-training/, userName) : dialog;
}

export async function getRecipeFromClaude(ingredients, userName = null) {
  const prompt = `You are Chef BonBon, an AI chef. Generate a creative and detailed recipe using only the following ingredients: ${ingredients.join(', ')}. Provide a list of ingredients with quantities, and step-by-step instructions. If an ingredient is unusual, suggest a common substitute. Make it delicious and easy to follow. Ensure the response starts directly with the recipe details (ingredients and instructions) without repeating the greeting, as it will be added separately.`;

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
      const recipeText = result.content[0].text;
      return `${getRandomDialog(userName)}\n\n${recipeText}`;
    } else {
      console.error("Unexpected proxy response structure:", result);
      throw new Error("Failed to extract recipe from proxy response.");
    }

  } catch (error) {
    console.error("Error generating recipe from proxy:", error);
    throw error;
  }
}