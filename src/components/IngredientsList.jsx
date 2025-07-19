import React from 'react';

export default function IngredientsList({ ingredients, handleClick, hasRecipeGenerated, removeIngredient }) {
  return (
    <section className="mt-8 mb-8">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Ingredients on hand:</h2>
      <ul className="text-gray-700 mb-6 space-y-2">
        {ingredients.map((ingredient, index) => (
          <li key={index} className="flex items-center justify-between text-lg bg-gray-50 px-3 py-2 rounded-md">
            <span className="flex items-center">
              <span className="w-2 h-2 bg-orange-500 rounded-full mr-3"></span>
              {ingredient}
            </span>
            {removeIngredient && (
              <button
                onClick={() => removeIngredient(index)}
                className="ml-2 text-gray-400 hover:text-red-500 transition-colors text-xl font-bold leading-none"
                aria-label={`Remove ${ingredient}`}
                title={`Remove ${ingredient}`}
              >
                ×
              </button>
            )}
          </li>
        ))}
      </ul>
      {/* The button is always enabled when this component is rendered */}
      <button
        onClick={handleClick}
        className={`w-full px-6 py-3 rounded-md text-lg font-semibold transition-colors shadow-md
          bg-orange-600 text-white hover:bg-orange-700`}
      >
        {hasRecipeGenerated ? 'Generate New Recipe' : 'Get Recipe!'}
      </button>
    </section>
  );
}
