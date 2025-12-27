// src/components/LoadingSpinner.jsx
import React from 'react';

export default function LoadingSpinner({ message }) {
  return (
    <div className="text-center text-gray-600 mt-8">
      <div className="flex justify-center">
        <div className="wave-container">
          <div className="wave-bar bg-orange-600"></div>
          <div
            className="wave-bar bg-orange-600"
            style={{ animationDelay: '-0.1s' }}
          ></div>
          <div
            className="wave-bar bg-orange-600"
            style={{ animationDelay: '-0.2s' }}
          ></div>
          <div
            className="wave-bar bg-orange-600"
            style={{ animationDelay: '-0.3s' }}
          ></div>
        </div>
      </div>

      <p className="mt-3 text-sm min-h-[1.25rem] transition-opacity">
        {message || ' '}
      </p>
    </div>
  );
}
