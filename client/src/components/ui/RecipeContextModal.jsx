import React from 'react';

export default function RecipeContextModal({ isOpen, onSelect }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[999]">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm">
        <h2 className="text-xl font-semibold mb-4 text-center">
          What are you making today?
        </h2>

        <div className="space-y-3">
          <button
            onClick={() => onSelect({ type: 'drink', cookingMethod: null })}
            className="w-full px-4 py-3 bg-orange-600 text-white rounded-md hover:bg-orange-700"
          >
            Drink
          </button>

          <div className="border-t pt-3">
            <p className="text-sm text-gray-600 mb-2 text-center">
              Food — choose how you’re cooking
            </p>

            {['stovetop', 'oven', 'air fryer', 'grill', 'no-cook'].map(method => (
              <button
                key={method}
                onClick={() =>
                  onSelect({ type: 'food', cookingMethod: method })
                }
                className="w-full px-4 py-2 mb-2 border rounded-md hover:bg-gray-100"
              >
                {method}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
