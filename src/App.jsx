// src/App.js
import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Main from './components/Main';
import AuthModal from './components/AuthModal';
import SavedRecipes from './components/SavedRecipes';
import PublicFeed from './components/PublicFeed';
import LikedRecipes from './components/LikedRecipes';
import BurgerMenu from './components/BurgerMenu';
import MessageModal from './components/MessageModal'; // Import MessageModal
import { setupAuthListener, auth } from './firebase';
import { signOut } from 'firebase/auth';

export default function App() {
  const [userId, setUserId] = useState(null);
  const [userName, setUserName] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [viewMode, setViewMode] = useState('main');

  // State for MessageModal
  const [messageModal, setMessageModal] = useState({
    isOpen: false,
    title: '',
    message: ''
  });

  useEffect(() => {
    const unsubscribe = setupAuthListener((user) => {
      if (user) {
        setUserId(user.uid);
        setUserName(user.displayName);
        console.log("App.js: onAuthStateChanged - User:", user.uid, "DisplayName:", user.displayName);
      } else {
        setUserId(null);
        setUserName(null);
        console.log("App.js: onAuthStateChanged - User signed out.");
        setViewMode('main');
      }
    }, setIsAuthReady);
    return () => unsubscribe();
  }, []);

  const handleAuthSuccess = () => {
    setShowAuthModal(false);
    if (auth.currentUser) {
      setUserName(auth.currentUser.displayName);
      console.log("App.js: Auth Success - Current User DisplayName:", auth.currentUser.displayName);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      console.log("User logged out successfully!");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  const openLoginModal = () => {
    setIsLoginMode(true);
    setShowAuthModal(true);
  };
  const openSignupModal = () => {
    setIsLoginMode(false);
    setShowAuthModal(true);
  };

  const handleGoHomeClick = () => setViewMode('main');
  const handleViewRecipesClick = () => setViewMode('savedRecipes');
  const handleViewPublicFeedClick = () => setViewMode('publicFeed');
  const handleViewLikedRecipesClick = () => setViewMode('likedRecipes');

  // Function to show the message modal
  const showMessageModal = (title, message) => {
    setMessageModal({ isOpen: true, title, message });
  };

  // Function to close the message modal
  const closeMessageModal = () => {
    setMessageModal({ ...messageModal, isOpen: false });
  };

  if (!isAuthReady) {
    return (
      <div className="min-h-screen bg-gray-100 font-sans antialiased flex flex-col items-center justify-center">
        <p className="text-gray-700 text-lg">Loading user session...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 font-sans antialiased flex flex-col items-center relative">
      <BurgerMenu
        userId={userId}
        userName={userName}
        onLoginClick={openLoginModal}
        onSignupClick={openSignupModal}
        onLogoutClick={handleLogout}
        onViewRecipesClick={handleViewRecipesClick}
        onGoHomeClick={handleGoHomeClick}
        onViewPublicFeedClick={handleViewPublicFeedClick}
        onViewLikedRecipesClick={handleViewLikedRecipesClick}
        currentViewMode={viewMode}
      />

      <Header userId={userId} userName={userName} />

      {viewMode === 'main' && <Main userId={userId} isAuthReady={isAuthReady} showMessageModal={showMessageModal} />} {/* Pass showMessageModal */}
      {viewMode === 'savedRecipes' && userId && <SavedRecipes userId={userId} onGoHomeClick={handleGoHomeClick} />}
      {viewMode === 'savedRecipes' && !userId && (
        <p className="text-center text-gray-600 mt-8">Please log in to view your saved recipes.</p>
      )}
      {viewMode === 'publicFeed' && <PublicFeed userId={userId} />}
      {viewMode === 'likedRecipes' && userId && <LikedRecipes userId={userId} onGoHomeClick={handleGoHomeClick} />}
      {viewMode === 'likedRecipes' && !userId && (
        <p className="text-center text-gray-600 mt-8">Please log in to view your liked recipes.</p>
      )}

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        isLogin={isLoginMode}
        onAuthSuccess={handleAuthSuccess}
      />

      {/* Render the MessageModal */}
      <MessageModal
        isOpen={messageModal.isOpen}
        title={messageModal.title}
        message={messageModal.message}
        onClose={closeMessageModal}
      />
    </div>
  );
}
