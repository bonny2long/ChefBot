import React from 'react';

export default function IngredientsList({ ingredients, removeIngredient }) {
  return (
    <section className="mt-3">
      <h2 className="text-xl font-semibold text-gray-800 mb-3">
        Ingredients on hand:
      </h2>

      <ul className="text-gray-700 space-y-2">
        {ingredients.map((ingredient, index) => (
          <li
            key={index}
            className="flex items-center justify-between text-lg bg-gray-50 px-3 py-2 rounded-md"
          >
            <span className="flex items-center">
              <span className="w-2 h-2 bg-orange-500 rounded-full mr-3"></span>
              {ingredient}
            </span>

            {removeIngredient && (
              <button
                onClick={() => removeIngredient(index)}
                className="ml-2 text-gray-400 hover:text-red-500 transition-colors text-xl font-bold leading-none"
                aria-label={`Remove ${ingredient}`}
              >
                ×
              </button>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
