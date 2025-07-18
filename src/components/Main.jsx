// src/components/Main.jsx
import React, { useState } from 'react';
import IngredientsList from './IngredientsList';
import { getRecipeFromClaude } from '../utils/getRecipeFromClaude';
import { addDoc, getPrivateRecipesCollectionRef } from '../firebase';
import LoadingSpinner from './LoadingSpinner'; // Updated component

export default function Main({ userId, isAuthReady, showMessageModal }) {
  const [ingredients, setIngredients] = useState([]);
  const [recipe, setRecipe] = useState('');
  const [recipeName, setRecipeName] = useState('');
  const [loading, setLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');

  async function handleSubmit(formData) {
    const newIngredient = formData.get('ingredient');
    if (!newIngredient.trim()) {
      showMessageModal(
        "Missing Input",
        "Please enter an ingredient before clicking 'Add ingredient'."
      );
      return;
    }

    const updatedIngredients = [...ingredients, newIngredient.trim()];
    setIngredients(updatedIngredients);

    setRecipe(''); // Clear previous recipe when new ingredients are added
    setRecipeName(''); // Clear recipe name when new ingredients are added
    setSaveStatus(''); // Clear save status
  }

  async function handleClick() {
    if (ingredients.length < 4) {
      showMessageModal(
        "Missing Ingredients",
        "Please add at least 4 ingredients to generate a recipe."
      );
      return;
    }
  
    setLoading(true);
    setRecipe(''); // Clear previous recipe
    setRecipeName(''); // Clear recipe name
    setSaveStatus(''); // Clear save status
    try {
      const result = await getRecipeFromClaude(ingredients);
      setRecipe(result);
    } catch (error) {
      console.error("Error generating recipe:", error);
      const errorMessage = error.message.includes("Anthropic API Key")
        ? "Failed to generate recipe: API key not configured. Please contact support."
        : "Failed to generate recipe. Please try again.";
      setRecipe(errorMessage);
      setSaveStatus(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  const handleSaveRecipe = async () => {
    if (!userId) {
      setSaveStatus("Please log in to save recipes.");
      return;
    }
    if (!recipe) {
      setSaveStatus("No recipe to save.");
      return;
    }
    if (!recipeName.trim()) {
      setSaveStatus("Please enter a name for your recipe.");
      return;
    }

    setSaveStatus("Saving...");
    try {
      const recipesCollectionRef = getPrivateRecipesCollectionRef(userId);
      if (!recipesCollectionRef) {
        setSaveStatus("Error: Could not get recipe collection reference.");
        return;
      }

      await addDoc(recipesCollectionRef, {
        recipeName: recipeName.trim(),
        ingredients: ingredients,
        recipeContent: recipe,
        createdAt: new Date(),
        userId: userId,
        isPublic: false
      });
      setSaveStatus("Recipe saved successfully!");
    
      setRecipeName('');
      setRecipe('');
      setIngredients([]); // Clear ingredients after saving a recipe
    } catch (error) {
      console.error("Error saving recipe:", error);
      setSaveStatus("Failed to save recipe. Please try again.");
    }
  };

  const handleTryDifferentIngredients = () => {
    setIngredients([]); // Clear all ingredients
    setRecipe('');      // Clear the generated recipe
    setRecipeName('');  // Clear the recipe name input
    setSaveStatus('');  // Clear any save status messages
  };

  // Determine the dynamic text for the "Add ingredient" button
  const getAddIngredientButtonText = () => {
    const count = ingredients.length;
    if (count === 0) {
      return '+ Add ingredient';
    } else if (count < 4) {
      const needed = 4 - count;
      return `${count} ingredient(s) entered (${needed} more needed)`;
    } else {
      return `${count} ingredient(s) entered`;
    }
  };

  return (
    <main className="p-8 md:p-16 w-full max-w-3xl mx-auto">
      {/* Conditional rendering of ingredient input form */}
      {!recipe && ( // Only show if no recipe has been generated yet
        <form
          className="flex justify-center items-center gap-3 h-10 md:flex-col md:h-auto md:gap-4 mb-8"
          onSubmit={e => {
            e.preventDefault();
            handleSubmit(new FormData(e.target));
            e.target.reset();
          }}
        >
          <input
            type="text"
            placeholder="e.g., Mango"
            aria-label="Add-ingredient"
            name="ingredient"
            className="rounded-md border border-gray-300 px-3 py-2 shadow-sm flex-grow min-w-[150px] max-w-xl md:w-full md:max-w-none focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
          <button
            type="submit"
            className="font-sans rounded-md border-none bg-orange-600 text-gray-50 w-36 text-sm font-medium px-4 py-2 hover:bg-orange-700 transition-colors md:w-full"
          >
            {getAddIngredientButtonText()}
          </button>
        </form>
      )}

      {/* Conditional rendering of IngredientsList - NOW ONLY IF 4+ INGREDIENTS AND NO RECIPE */}
      {ingredients.length >= 4 && !recipe && (
        <IngredientsList ingredients={ingredients} handleClick={handleClick} hasRecipeGenerated={!!recipe} />
      )}

      {/* Always show ingredients list if ingredients exist, but only show Get Recipe button if >= 4 */}
      {ingredients.length > 0 && ingredients.length < 4 && !recipe && (
        <section className="mt-8 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Ingredients on hand:</h2>
          <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
            {ingredients.map((ingredient, index) => (
              <li key={index} className="text-lg">{ingredient}</li>
            ))}
          </ul>
          {/* No "Get Recipe" button here */}
        </section>
      )}

      {loading && <LoadingSpinner />} {/* Updated to use wave animation */}

      {recipe && (
        <section className="rounded-lg bg-gray-200 p-4 mt-8 md:p-6 shadow-md">
          <button
            onClick={handleTryDifferentIngredients}
            className="mb-4 px-6 py-2 bg-orange-600 text-white rounded-md text-lg font-semibold hover:bg-orange-700 transition-colors shadow-md w-full"
          >
            Try Different Ingredients
          </button>

          <h2 className="text-xl font-semibold mb-4 text-orange-800">Generated Recipe</h2>
          <div
            className="whitespace-pre-wrap break-words overflow-wrap-break-word font-sans leading-relaxed text-gray-800 text-base md:text-sm"
            aria-live="polite"
          >
            {recipe}
          </div>
          {userId && (
            <div className="mt-4">
              <div className="mb-3">
                <label htmlFor="recipeName" className="block text-sm font-medium text-gray-700 mb-1">
                  Name your recipe:
                </label>
                <input
                  type="text"
                  id="recipeName"
                  placeholder="e.g., Delicious Chicken Curry"
                  value={recipeName}
                  onChange={(e) => setRecipeName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-base focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleSaveRecipe}
                  disabled={saveStatus === "Saving..." || !recipeName.trim()}
                  className="px-4 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {saveStatus === "Saving..." ? "Saving..." : "Save Recipe"}
                </button>
                {saveStatus && saveStatus !== "Saving..." && (
                  <p className={`text-sm ${saveStatus.includes("Failed") ? 'text-red-600' : 'text-gray-700'}`}>
                    {saveStatus}
                  </p>
                )}
              </div>
            </div>
          )}
        </section>
      )}
    </main>
  );
}