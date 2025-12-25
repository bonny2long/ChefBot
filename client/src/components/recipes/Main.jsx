// src/components/recipes/Main.jsx
import React, { useState } from 'react';
import IngredientsList from './IngredientsList';
import { getRecipeFromClaude } from '../../utils/api';
import { supabase } from '../../lib/supabase';
import LoadingSpinner from '../ui/LoadingSpinner';
import CookingMethodModal from '../ui/CookingMethodModal';

export default function Main({ userId, isAuthReady, showMessageModal }) {
  const [ingredients, setIngredients] = useState([]);
  const [recipe, setRecipe] = useState('');
  const [recipeName, setRecipeName] = useState('');
  const [loading, setLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');

  // Cooking method flow
  const [showCookingModal, setShowCookingModal] = useState(false);
  const [pendingIngredients, setPendingIngredients] = useState([]);

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

  async function handleClick() {
    if (ingredients.length < 4) {
      showMessageModal(
        'Missing Ingredients',
        'Please add at least 4 ingredients to generate a recipe.'
      );
      return;
    }

    setLoading(true);
    setRecipe('');
    setRecipeName('');
    setSaveStatus('');

    try {
const result = await getRecipeFromClaude(ingredients);

if (result.needsCookingMethod) {
  setPendingIngredients(ingredients);
  setShowCookingModal(true);
  setLoading(false); // 🔥 REQUIRED
  return;
}

setRecipe(result.recipe);

    } catch (error) {
      console.error('Error generating recipe:', error);
      setRecipe('Failed to generate recipe. Please try again.');
      setSaveStatus('Failed to generate recipe.');
    } finally {
      setLoading(false);
    }
  }

const handleCookingMethodSelect = async (method) => {
  setShowCookingModal(false);
  setLoading(true);

  try {
    const result = await getRecipeFromClaude(pendingIngredients, method);
    setRecipe(result.recipe);
  } catch (err) {
    showMessageModal('Error', 'Failed to generate recipe.');
  } finally {
    setLoading(false);
    setPendingIngredients([]);
  }
};


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
      className="w-full max-w-xs px-6 py-3 rounded-md text-lg font-semibold bg-orange-600 text-white hover:bg-orange-700 transition-colors whitespace-nowrap"
    >
      Get Recipe!
    </button>
  </div>
)}


      {loading && <LoadingSpinner />}

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

      <CookingMethodModal
        isOpen={showCookingModal}
        onSelect={handleCookingMethodSelect}
        onClose={() => setShowCookingModal(false)}
      />
    </main>
  );
}
