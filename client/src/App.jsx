// src/App.jsx
import React, { useState, useEffect, Suspense, lazy } from "react";
import Header from "./components/layout/Header";
import BurgerMenu from "./components/layout/BurgerMenu";
import AuthModal from "./components/auth/AuthModal";
import MessageModal from "./components/ui/MessageModal";

// Supabase imports
import { setupAuthListener, signOut } from "./lib/supabase";

const Main = lazy(() => import("./components/recipes/Main"));
const SavedRecipes = lazy(() => import("./components/recipes/SavedRecipes"));
const PublicFeed = lazy(() => import("./components/recipes/PublicFeed"));
const LikedRecipes = lazy(() => import("./components/recipes/LikedRecipes"));

export default function App() {
  const [userId, setUserId] = useState(null);
  const [userName, setUserName] = useState("");
  const [isAuthReady, setIsAuthReady] = useState(false);

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState("login");

  const [messageModal, setMessageModal] = useState({
    isOpen: false,
    title: "",
    message: "",
  });

  const [currentViewMode, setCurrentViewMode] = useState("main");

  const formatDisplayName = (user, usernameFromDb) => {
    const usernameLooksLikeEmail =
      usernameFromDb && usernameFromDb.includes("@");

    const rawName =
      (!usernameLooksLikeEmail && usernameFromDb) ||
      user.displayName ||
      user.email ||
      user.uid;
    if (!rawName) return "";
    const trimmed = rawName.trim();
    const firstName = trimmed.split(/\s+/)[0];
    return firstName || trimmed;
  };

  useEffect(() => {
    const unsubscribe = setupAuthListener((user, usernameFromDb) => {
      if (user) {
        setUserId(user.uid);
        if (user.isAnonymous) {
          setUserName("Guest");
        } else {
          setUserName(formatDisplayName(user, usernameFromDb));
        }
      } else {
        setUserId(null);
        setUserName("");
        setCurrentViewMode("main");
      }
      setIsAuthReady(true);
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
    setShowAuthModal(false);
    showMessageModal(
      "Success",
      authMode === "login"
        ? "Logged in successfully!"
        : "Account created and logged in!"
    );
  };

  const handleLogout = async () => {
    try {
      await signOut();
      showMessageModal("Success", "Logged out successfully!");
      setCurrentViewMode("main");
    } catch (error) {
      console.error("Logout error:", error);
      showMessageModal("Logout Failed", error.message);
    }
  };

  const openLoginModal = () => {
    setAuthMode("login");
    setShowAuthModal(true);
  };
  const openSignupModal = () => {
    setAuthMode("signup");
    setShowAuthModal(true);
  };

  const handleGoHomeClick = () => setCurrentViewMode("main");
  const handleViewRecipesClick = () => setCurrentViewMode("savedRecipes");
  const handleViewPublicFeedClick = () => setCurrentViewMode("publicFeed");
  const handleViewLikedRecipesClick = () => setCurrentViewMode("likedRecipes");

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
        <Suspense
          fallback={
            <p className="text-center text-gray-600 mt-8">Loading...</p>
          }
        >
          {currentViewMode === "main" && (
            <Main
              userId={userId}
              isAuthReady={isAuthReady}
              showMessageModal={showMessageModal}
            />
          )}
          {currentViewMode === "savedRecipes" && userId && (
            <SavedRecipes userId={userId} onGoHomeClick={handleGoHomeClick} />
          )}
          {currentViewMode === "savedRecipes" && !userId && (
            <p className="text-center text-gray-600 mt-8">
              Please log in to view your saved recipes.
            </p>
          )}
          {currentViewMode === "publicFeed" && (
            <PublicFeed userId={userId} showMessageModal={showMessageModal} />
          )}
          {currentViewMode === "likedRecipes" && userId && (
            <LikedRecipes
              userId={userId}
              onGoHomeClick={handleGoHomeClick}
              onViewPublicFeedClick={handleViewPublicFeedClick}
              showMessageModal={showMessageModal}
            />
          )}
          {currentViewMode === "likedRecipes" && !userId && (
            <p className="text-center text-gray-600 mt-8">
              Please log in to view your liked recipes.
            </p>
          )}
        </Suspense>
      </div>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        isLogin={authMode === "login"}
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
