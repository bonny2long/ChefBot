import express from 'express';
import { generateRecipeText } from '../services/claudeService.js';

const router = express.Router();

router.post('/recipes', async (req, res) => {
  try {
    const { ingredients, cookingMethod, type } = req.body;
    const apiKey = process.env.ANTHROPIC_API_KEY;
    const normalizedType =
      typeof type === 'string' && ['food', 'drink'].includes(type.toLowerCase())
        ? type.toLowerCase()
        : null;
    const normalizedMethod =
      typeof cookingMethod === 'string' ? cookingMethod.trim() : '';

    // Validation
    if (!Array.isArray(ingredients) || ingredients.length < 4) {
      return res.status(400).json({
        error: 'Please provide at least 4 ingredients to get a high-quality recipe.'
      });
    }

    if (!normalizedType || !['food', 'drink'].includes(normalizedType)) {
      return res.status(400).json({
        error: 'Recipe type must be food or drink'
      });
    }

    /* =========================
       DRINK
       ========================= */
    if (normalizedType === 'drink') {
      if (normalizedMethod) {
        console.warn('Ignoring cookingMethod for drink recipe');
      }

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
       FOOD
       ========================= */
    if (!normalizedMethod) {
      return res.status(400).json({
        error: 'Cooking method required for food recipes'
      });
    }

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
${normalizedMethod}

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
