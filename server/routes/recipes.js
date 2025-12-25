import express from 'express';
import {
  generateRecipe,
  detectRecipeIntent
} from '../services/claudeService.js';

const router = express.Router();

router.post('/recipes', async (req, res) => {
  try {
    const { ingredients, cookingMethod } = req.body;
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!Array.isArray(ingredients) || ingredients.length === 0) {
      return res.status(400).json({ error: 'ingredients[] is required' });
    }

    const intent = await detectRecipeIntent(ingredients, apiKey);

    // TEMP LOG — confirms behavior
    console.log('Recipe intent detected:', intent);

    if (intent === 'drink') {
      const drinkPrompt = `
Create a drink recipe using these ingredients:
${ingredients.join(', ')}

Include:
- Name
- Ingredients
- Steps
- Glass type
- Optional garnish
`;

      const recipe = await generateRecipe(drinkPrompt, apiKey);

      return res.json({
        recipeType: 'drink',
        recipe
      });
    }

    // FOOD detected — cooking method required next
    if (!cookingMethod) {
      return res.json({
        recipeType: 'food',
        needsCookingMethod: true
      });
    }

  } catch (err) {
    console.error('Recipe route error:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
