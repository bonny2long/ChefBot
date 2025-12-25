import express from 'express';
import {
  generateRecipeText,
  detectRecipeIntent
} from '../services/claudeService.js';

const router = express.Router();

router.post('/recipes', async (req, res) => {
  try {
    const { ingredients, cookingMethod } = req.body;
    const apiKey = process.env.ANTHROPIC_API_KEY;

    // Validation
    if (!Array.isArray(ingredients) || ingredients.length < 4) {
      return res.status(400).json({
        error: 'Please provide at least 4 ingredients to get a high-quality recipe.'
      });
    }

    const intent = await detectRecipeIntent(ingredients, apiKey);
    console.log('Recipe intent:', intent);

    /* =========================
       🍸 DRINK
       ========================= */
    if (intent === 'drink') {
      const prompt = `
You are Chef BonBon, a professional bartender focused on balance and drinkability.

Ingredients:
${ingredients.join(', ')}

Allowed staples:
- ice
- water
- simple syrup (only if needed)

Rules:
- You MUST use all listed ingredients
- Do NOT invent additional liquors or mixers
- If flavors clash, simplify rather than embellish

Format exactly:

Drink Name:
Ingredients:
- item with amount

Steps:
1. step

Glass:
Why this works:
- brief explanation
`;

      const recipeText = await generateRecipeText(prompt, apiKey);

      return res.json({
        recipeType: 'drink',
        recipe: recipeText
      });
    }

    /* =========================
       🍽 FOOD — Ask for method
       ========================= */
    if (!cookingMethod) {
      return res.json({
        recipeType: 'food',
        needsCookingMethod: true
      });
    }

    /* =========================
       🍽 FOOD
       ========================= */
    const prompt = `
You are Chef BonBon, a thoughtful home cook.

Ingredients:
${ingredients.join(', ')}

Allowed pantry staples:
- oil
- salt
- pepper
- garlic
- water

Cooking method:
${cookingMethod}

Rules:
- You MUST use all listed ingredients
- Pantry staples may support, not dominate
- Respect the cooking method
- Favor realism over creativity

Format exactly:

Recipe Name:
Ingredients:
- item with amount

Steps:
1. step

Cooking Tips:
- tips specific to ${cookingMethod}

Why this works:
- short explanation
`;

    const recipeText = await generateRecipeText(prompt, apiKey);

    return res.json({
      recipeType: 'food',
      recipe: recipeText
    });

  } catch (err) {
    console.error('Recipe route error:', err);
    res.status(500).json({
      error: 'Something went wrong with the chef.'
    });
  }
});

export default router;
