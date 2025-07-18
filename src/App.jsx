// src/App.jsx
import React, { useState, useEffect, Suspense, lazy } from 'react';
import Header from './components/Header';
import BurgerMenu from './components/BurgerMenu';
import AuthModal from './components/AuthModal';
import MessageModal from './components/MessageModal';

// Firebase imports
import { auth, setupAuthListener, signOut } from './firebase';

const Main = lazy(() => import('./components/Main'));
const SavedRecipes = lazy(() => import('./components/SavedRecipes'));
const PublicFeed = lazy(() => import('./components/PublicFeed'));
const LikedRecipes = lazy(() => import('./components/LikedRecipes'));

export default function App() {
  const [userId, setUserId] = useState(null);
  const [userName, setUserName] = useState('');
  const [isAuthReady, setIsAuthReady] = useState(false);

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'signup'

  const [messageModal, setMessageModal] = useState({
    isOpen: false,
    title: '',
    message: ''
  });

  const [currentViewMode, setCurrentViewMode] = useState('main');

  useEffect(() => {
    const unsubscribe = setupAuthListener((user, usernameFromDb) => {
      if (user) {
        setUserId(user.uid);
        if (user.isAnonymous) {
          setUserName('Guest');
        } else {
          setUserName(usernameFromDb || user.displayName || user.email || user.uid);
        }
      } else {
        setUserId(null);
        setUserName('');
        setCurrentViewMode('main');
      }
      setIsAuthReady(true); // Auth state is determined
    }, setIsAuthReady);
    return () => unsubscribe();
  }, []);

  // Centralized function to show message modal
  const showMessageModal = (title, message) => {
    setMessageModal({ isOpen: true, title, message });
  };

  // Centralized function to close message modal
  const closeMessageModal = () => {
    setMessageModal({ ...messageModal, isOpen: false });
  };

  // AuthModal's onAuthSuccess handler
  const handleAuthSuccess = () => {
    setShowAuthModal(false); // Close the auth modal
    showMessageModal("Success", authMode === 'login' ? "Logged in successfully!" : "Account created and logged in!");
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      showMessageModal("Success", "Logged out successfully!");
      setCurrentViewMode('main'); // Go back to home page after logout
    } catch (error) {
      console.error("Logout error:", error);
      showMessageModal("Logout Failed", error.message);
    }
  };

  const openLoginModal = () => {
    setAuthMode('login');
    setShowAuthModal(true);
  };
  const openSignupModal = () => {
    setAuthMode('signup');
    setShowAuthModal(true);
  };

  const handleGoHomeClick = () => setCurrentViewMode('main');
  const handleViewRecipesClick = () => setCurrentViewMode('savedRecipes');
  const handleViewPublicFeedClick = () => setCurrentViewMode('publicFeed');
  const handleViewLikedRecipesClick = () => setCurrentViewMode('likedRecipes');

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
        currentViewMode={currentViewMode}
      />

      <Header userId={userId} userName={userName} />

      <div className="flex-grow flex justify-center items-start pt-32 pb-8 w-full">
        <Suspense fallback={<p className="text-center text-gray-600 mt-8">Loading...</p>}>
          {currentViewMode === 'main' && <Main userId={userId} isAuthReady={isAuthReady} showMessageModal={showMessageModal} />}
          {currentViewMode === 'savedRecipes' && userId && <SavedRecipes userId={userId} onGoHomeClick={handleGoHomeClick} />}
          {currentViewMode === 'savedRecipes' && !userId && (
            <p className="text-center text-gray-600 mt-8">Please log in to view your saved recipes.</p>
          )}
          {currentViewMode === 'publicFeed' && <PublicFeed userId={userId} showMessageModal={showMessageModal} />}
          {currentViewMode === 'likedRecipes' && userId && <LikedRecipes userId={userId} onGoHomeClick={handleGoHomeClick} onViewPublicFeedClick={handleViewPublicFeedClick} showMessageModal={showMessageModal} />}
          {currentViewMode === 'likedRecipes' && !userId && (
            <p className="text-center text-gray-600 mt-8">Please log in to view your liked recipes.</p>
          )}
        </Suspense>
      </div>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        isLogin={authMode === 'login'}
        onAuthSuccess={handleAuthSuccess}
      />

      <MessageModal
        isOpen={messageModal.isOpen}
        title={messageModal.title}
        message={messageModal.message}
        onClose={closeMessageModal}
      />
    </div>
  );
}