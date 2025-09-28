// src/components/AuthModal.jsx
import React, { useState } from "react";

import { auth } from "../firebase";

export default function AuthModal({
  isOpen,
  onClose,
  isLogin,
  onAuthSuccess,
  onLogin,
  onSignup,
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isLogin) {
        await onLogin(email, password); // Call the onLogin prop from App.js
      } else {
        await onSignup(email, password); // Call the onSignup prop from App.js
      }
      onAuthSuccess(); // Notify App.js of success (e.g., to close modal and show message)
    } catch (err) {
      // Errors from onLogin/onSignup (in App.js) are typically handled by App.js's showMessageModal.
      // This catch is for any direct errors within AuthModal's handleSubmit itself, or re-thrown errors.
      console.error("AuthModal handleSubmit error:", err.message);
      let errorMessage = "An unknown error occurred.";
      if (err.code === "auth/email-already-in-use") {
        errorMessage = "This email is already in use.";
      } else if (err.code === "auth/invalid-email") {
        errorMessage = "Please enter a valid email address.";
      } else if (err.code === "auth/weak-password") {
        errorMessage = "Password should be at least 6 characters.";
      } else if (
        err.code === "auth/user-not-found" ||
        err.code === "auth/wrong-password"
      ) {
        errorMessage = "Invalid email or password.";
      } else if (err.code === "auth/operation-not-allowed") {
        errorMessage =
          "Email/password sign-in is not enabled. Please contact support.";
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">
            {isLogin ? "Login" : "Sign Up"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && (
            <p className="text-red-600 text-sm text-center bg-red-100 p-2 rounded-md border border-red-200">
              {error}
            </p>
          )}

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-orange-600 text-white font-semibold rounded-md shadow-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
          >
            {loading
              ? isLogin
                ? "Logging In..."
                : "Signing Up..."
              : isLogin
              ? "Login"
              : "Sign Up"}
          </button>

          {/* Removed Google sign-in section for simplicity and to match previous decisions */}
        </form>
      </div>
    </div>
  );
}
