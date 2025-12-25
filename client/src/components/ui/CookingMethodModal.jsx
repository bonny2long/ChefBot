import React from 'react';

export default function CookingMethodModal({ isOpen, onSelect, onClose }) {
  if (!isOpen) return null;

  const methods = [
    'Oven',
    'Stovetop',
    'Grill',
    'Air Fryer',
    'Slow Cooker',
  ];

  return (
    <div
      className="
        fixed inset-0 z-[999]
        flex items-center justify-center
        bg-black/60
        p-4
      "
      onClick={onClose}
    >
      <div
        className="
          relative
          bg-white
          rounded-lg
          shadow-2xl
          p-6
          max-w-md
          w-full
        "
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold text-gray-800 mb-2">
          How are you cooking this?
        </h2>

        <p className="text-gray-600 mb-6">
          Select a cooking method so we can tailor the recipe.
        </p>

        <div className="space-y-3">
          {methods.map((method) => (
            <button
              key={method}
              onClick={() => onSelect(method)}
              className="
                w-full
                px-4
                py-3
                text-left
                border
                border-gray-300
                rounded-md
                bg-white
                text-gray-800
                hover:bg-orange-50
                hover:border-orange-400
                transition-colors
              "
            >
              {method}
            </button>
          ))}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
