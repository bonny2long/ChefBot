// src/components/BurgerMenu.jsx
import React, { useState, useEffect, useRef } from 'react';


export default function BurgerMenu({
  userId,
  userName, // Added userName prop for display
  onLoginClick,
  onSignupClick,
  onLogoutClick,
  onViewRecipesClick,
  onGoHomeClick,
  onViewPublicFeedClick,
  onViewLikedRecipesClick,
  currentViewMode
}) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);
  const displayName = (userName && userName.trim()) || 'Guest';

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuRef]);

  const handleMenuItemClick = (action) => {
    action();
    setIsOpen(false);
  };

  return (
    <div className="fixed top-4 right-4 z-50" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex flex-col justify-around w-8 h-8 bg-orange-600 rounded-md p-1 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
        aria-label="Toggle navigation menu"
      >
        <span className={`block h-0.5 w-full bg-white transform transition duration-300 ease-in-out ${isOpen ? 'rotate-45 translate-y-2.5' : ''}`}></span>
        <span className={`block h-0.5 w-full bg-white transition duration-300 ease-in-out ${isOpen ? 'opacity-0' : ''}`}></span>
        <span className={`block h-0.5 w-full bg-white transform transition duration-300 ease-in-out ${isOpen ? '-rotate-45 -translate-y-2.5' : ''}`}></span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5 focus:outline-none">
          {userId && (
            <div className="px-4 py-2 text-sm text-gray-600 border-b border-gray-100">
              Signed in as <span className="font-semibold text-gray-900">{displayName}</span>
            </div>
          )}
          <button
            onClick={() => handleMenuItemClick(onGoHomeClick)}
            className={`block w-full text-left px-4 py-2 text-sm ${currentViewMode === 'main' ? 'bg-gray-100 text-gray-900 font-semibold' : 'text-gray-700 hover:bg-gray-100'}`}
          >
            Home
          </button>
          {userId && (
            <button
              onClick={() => handleMenuItemClick(onViewRecipesClick)}
              className={`block w-full text-left px-4 py-2 text-sm ${currentViewMode === 'savedRecipes' ? 'bg-gray-100 text-gray-900 font-semibold' : 'text-gray-700 hover:bg-gray-100'}`}
            >
              My Recipes
            </button>
          )}
          <button
            onClick={() => handleMenuItemClick(onViewPublicFeedClick)}
            className={`block w-full text-left px-4 py-2 text-sm ${currentViewMode === 'publicFeed' ? 'bg-gray-100 text-gray-900 font-semibold' : 'text-gray-700 hover:bg-gray-100'}`}
          >
            Public Feed
          </button>
          {userId && (
            <button
              onClick={() => handleMenuItemClick(onViewLikedRecipesClick)}
              className={`block w-full text-left px-4 py-2 text-sm ${currentViewMode === 'likedRecipes' ? 'bg-gray-100 text-gray-900 font-semibold' : 'text-gray-700 hover:bg-gray-100'}`}
            >
              Liked Recipes
            </button>
          )}
          <hr className="my-1 border-gray-200" />
          {userId ? (
            <button
              onClick={() => handleMenuItemClick(onLogoutClick)}
              className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
            >
              Logout
            </button>
          ) : (
            <>
              <button
                onClick={() => handleMenuItemClick(onLoginClick)}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Login
              </button>
              <button
                onClick={() => handleMenuItemClick(onSignupClick)}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Sign Up
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
