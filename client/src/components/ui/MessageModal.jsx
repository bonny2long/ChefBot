// src/components/MessageModal.jsx
import React from 'react';

export default function MessageModal({ isOpen, onClose, message, title = "Notification" }) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[999]" 
      onClick={onClose} 
    >
      <div
        className="relative bg-white rounded-lg shadow-2xl p-6 max-w-sm w-full m-auto transform transition-all duration-300 scale-100 opacity-100"
        onClick={(e) => e.stopPropagation()} 
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 text-2xl font-bold"
          aria-label="Close message"
        >
          &times;
        </button>
        <h2 className="text-xl font-bold text-gray-800 mb-4">{title}</h2>
        <p className="text-gray-700 mb-6">{message}</p>
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
