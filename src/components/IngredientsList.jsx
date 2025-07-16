import React from 'react';

export default function IngredientsList({ ingredients, handleClick, hasRecipeGenerated }) {
  return (
    <section className="mt-8 mb-8">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Ingredients on hand:</h2>
      <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
        {ingredients.map((ingredient, index) => (
          <li key={index} className="text-lg">{ingredient}</li>
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
