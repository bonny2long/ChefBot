// src/components/AuthModal.jsx
import React from 'react';
import AuthForm from './AuthForm'; // Import the AuthForm component

export default function AuthModal({ isOpen, onClose, isLogin, onAuthSuccess }) {
  if (!isOpen) return null; // Don't render anything if the modal is not open

  return (
    // Modal overlay: fixed position, full screen, semi-transparent background
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={onClose} // Close modal when clicking outside the form
    >
      {/* Modal content container: centered, with a white background and shadow */}
      <div
        className="relative bg-white rounded-lg shadow-2xl p-6 max-w-md w-full m-auto"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside the form
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 text-2xl font-bold"
          aria-label="Close modal"
        >
          &times;
        </button>

        {/* Render the authentication form inside the modal */}
        <AuthForm isLogin={isLogin} onClose={onClose} onAuthSuccess={onAuthSuccess} />
      </div>
    </div>
  );
}
