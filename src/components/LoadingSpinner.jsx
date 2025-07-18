// src/components/LoadingSpinner.jsx
import React from 'react';

export default function LoadingSpinner() {
  return (
    <div className="text-center text-gray-600 mt-8">
      <div className="flex justify-center">
        <div className="wave-container">
          <div className="wave-bar bg-orange-600"></div>
          <div className="wave-bar bg-orange-600" style={{ animationDelay: '-0.1s' }}></div>
          <div className="wave-bar bg-orange-600" style={{ animationDelay: '-0.2s' }}></div>
          <div className="wave-bar bg-orange-600" style={{ animationDelay: '-0.3s' }}></div>
        </div>
      </div>
      <p className="mt-2">Seeing what I got for you boss...</p>
    </div>
  );
}

/* Add this CSS to your global stylesheet (e.g., index.css or App.css) or inline with a style tag */



