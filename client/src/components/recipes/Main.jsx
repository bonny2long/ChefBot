// src/components/recipes/Main.jsx
import React, { useState, useEffect } from 'react';
import IngredientsList from './IngredientsList';
import { getRecipeFromClaude } from '../../utils/api';
import { supabase } from '../../lib/supabase';
import LoadingSpinner from '../ui/LoadingSpinner';
import RecipeContextModal from '../ui/RecipeContextModal';

export default function Main({ userId, showMessageModal }) {
  const [ingredients, setIngredients] = useState([]);
  const [recipe, setRecipe] = useState('');
  const [recipeName, setRecipeName] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [saveStatus, setSaveStatus] = useState('');
  const [recipeContext, setRecipeContext] = useState(() => {
    const stored = sessionStorage.getItem('recipeContext');
    if (!stored) return null;

    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  });

  async function handleSubmit(formData) {
    const newIngredient = formData.get('ingredient');

    if (!newIngredient.trim()) {
      showMessageModal(
        'Missing Input',
        "Please enter an ingredient before clicking 'Add ingredient'."
      );
      return;
    }

    setIngredients([...ingredients, newIngredient.trim()]);
    setRecipe('');
    setRecipeName('');
    setSaveStatus('');
  }

  useEffect(() => {
    const resetHandler = () => {
      sessionStorage.removeItem('recipeContext');
      setRecipeContext(null);
      setIngredients([]);
      setRecipe('');
      setRecipeName('');
      setSaveStatus('');
      setLoading(false);
      setLoadingMessage('');
    };

    window.addEventListener('recipe-mode-reset', resetHandler);
    return () => window.removeEventListener('recipe-mode-reset', resetHandler);
  }, []);

  async function handleClick() {
    if (ingredients.length < 4) {
      showMessageModal(
        'Missing Ingredients',
        'Please add at least 4 ingredients.'
      );
      return;
    }

    const normalizedType =
      typeof recipeContext?.type === 'string'
        ? recipeContext.type.toLowerCase()
        : null;

    setLoading(true);
    setLoadingMessage('Understanding ingredients...');
    const stage1 = setTimeout(
      () => setLoadingMessage('Composing recipe...'),
      1600
    );
    const stage2 = setTimeout(
      () => setLoadingMessage('Final touches...'),
      3800
    );
    const stage3 = setTimeout(
      () => setLoadingMessage('Almost ready...'),
      5800
    );
    setRecipe('');
    setSaveStatus('');

    try {
      const result = await getRecipeFromClaude(
        ingredients,
        normalizedType === 'food' ? recipeContext.cookingMethod : null,
        normalizedType
      );

      setRecipe(result.recipe);
    } catch (error) {
      console.error(error);
      setRecipe('Failed to generate recipe.');
    } finally {
      clearTimeout(stage1);
      clearTimeout(stage2);
      clearTimeout(stage3);
      setLoading(false);
      setLoadingMessage('');
    }
  }


  const handleSaveRecipe = async () => {
    if (!userId) {
      setSaveStatus('Please log in to save recipes.');
      return;
    }

    if (!recipe || !recipeName.trim()) {
      setSaveStatus('Please name your recipe before saving.');
      return;
    }

    setSaveStatus('Saving...');
    try {
      const { error } = await supabase.from('private_recipes').insert({
        user_id: userId,
        title: recipeName.trim(),
        ingredients: JSON.stringify(ingredients),
        instructions: recipe,
        created_at: new Date().toISOString(),
      });

      if (error) throw error;

      setSaveStatus('Recipe saved successfully!');
      setIngredients([]);
      setRecipe('');
      setRecipeName('');
    } catch (error) {
      console.error('Save error:', error);
      setSaveStatus('Failed to save recipe.');
    }
  };

  const handleTryDifferentIngredients = () => {
    setIngredients([]);
    setRecipe('');
    setRecipeName('');
    setSaveStatus('');
  };

  const removeIngredient = (index) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const getAddIngredientButtonText = () => {
    const count = ingredients.length;
    if (count === 0) return '+ Add ingredient';
    if (count < 4) return `${count} ingredient(s) entered (${4 - count} more needed)`;
    return `${count} ingredient(s) entered`;
  };

  if (!recipeContext) {
    return (
      <RecipeContextModal
        isOpen={true}
        onSelect={(context) => {
          sessionStorage.setItem('recipeContext', JSON.stringify(context));
          setRecipeContext(context);
          setIngredients([]);
          setRecipe('');
          setRecipeName('');
          setSaveStatus('');
          setLoadingMessage('');
          window.dispatchEvent(new Event('recipe-mode-changed'));
        }}
      />
    );
  }

  return (
    <main className="p-8 md:p-16 w-full max-w-3xl mx-auto">
      {!recipe && (
        <form
          className="flex flex-col items-center gap-3 mb-3"
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit(new FormData(e.target));
            e.target.reset();
          }}
        >
          <input
            type="text"
            name="ingredient"
            placeholder="e.g., Mango"
            className="rounded-md border border-gray-300 px-3 py-2 shadow-sm w-full max-w-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
          />

          <button
            type="submit"
            className="
              rounded-md bg-orange-600 text-white
              w-full max-w-xs
              px-4 py-2
              hover:bg-orange-700 transition-colors
              whitespace-nowrap text-center
            "
          >
            {getAddIngredientButtonText()}
          </button>
        </form>
      )}

      {/* Always show ingredients once there is at least one */}
      {ingredients.length > 0 && !recipe && (
        <IngredientsList
          ingredients={ingredients}
          removeIngredient={removeIngredient}
        />
      )}

      {/* Only show Get Recipe button when ready */}
      {ingredients.length >= 4 && !recipe && (
        <div className="flex justify-center mt-2">
          <button
            onClick={handleClick}
            disabled={loading}
            className={`w-full max-w-xs px-6 py-3 rounded-md text-lg font-semibold text-white transition-colors whitespace-nowrap
              ${loading ? 'bg-orange-400 cursor-not-allowed' : 'bg-orange-600 hover:bg-orange-700'}
            `}
          >
            {loading ? 'Working...' : 'Get Recipe!'}
          </button>
        </div>
      )}

      {loading && <LoadingSpinner message={loadingMessage} />}

      {recipe && (
        <section className="rounded-lg bg-gray-200 p-4 mt-8 shadow-md">
          <button
            onClick={handleTryDifferentIngredients}
            className="mb-4 px-6 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 w-full"
          >
            Try Different Ingredients
          </button>

          <h2 className="text-xl font-semibold mb-4 text-orange-800">
            Generated Recipe
          </h2>

          <div className="whitespace-pre-wrap text-gray-800">{recipe}</div>

          {userId && (
            <div className="mt-4">
              <input
                type="text"
                placeholder="Name your recipe"
                value={recipeName}
                onChange={(e) => setRecipeName(e.target.value)}
                className="w-full px-3 py-2 border rounded-md mb-2"
              />

              <button
                onClick={handleSaveRecipe}
                disabled={!recipeName.trim()}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Save Recipe
              </button>

              {saveStatus && (
                <p className="mt-2 text-sm text-gray-700">{saveStatus}</p>
              )}
            </div>
          )}
        </section>
      )}

    </main>
  );
}
