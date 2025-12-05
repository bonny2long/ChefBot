import React, { useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  supabase
} from '../supabase';

export default function AuthModal({ isOpen, onClose, isLogin, onAuthSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState(''); // Username state is used here
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null; // Only render if isOpen is true

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let userCredential;
      if (isLogin) {
        userCredential = await signInWithEmailAndPassword(email, password);
      } else {
        userCredential = await createUserWithEmailAndPassword(email, password);

        // Set displayName during signup
        await updateProfile(userCredential.user, {
          display_name: username
        });

        // Save username to Supabase user_profiles table
        const { error: profileError } = await supabase
          .from('user_profiles')
          .insert({
            user_id: userCredential.user.uid,
            username: username,
            email: email,
            created_at: new Date().toISOString(),
          });

        if (profileError) {
          console.error("Error creating user profile:", profileError);
        }
      }

      // Reload user to get latest data
      await userCredential.user.reload();

      // Close modal and notify success
      onClose();
      onAuthSuccess(); // Notify App.js of success
    } catch (err) {
      console.error("Authentication error:", err.message);
      let errorMessage = "An unknown error occurred.";

      // Supabase error handling
      if (err.message?.includes('already registered')) {
        errorMessage = "This email is already in use.";
      } else if (err.message?.includes('Invalid email')) {
        errorMessage = "Please enter a valid email address.";
      } else if (err.message?.includes('Password') && err.message?.includes('6')) {
        errorMessage = "Password should be at least 6 characters.";
      } else if (err.message?.includes('Invalid login credentials')) {
        errorMessage = "Invalid email or password.";
      } else if (err.message?.includes('Email not confirmed')) {
        errorMessage = "Please confirm your email address.";
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) throw error;

      // Note: OAuth will redirect the user, so we don't need to handle success here
      // The auth state listener will handle it after redirect
    } catch (err) {
      console.error("Google Sign-In error:", err.message);
      setError("Failed to sign in with Google. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">
            {isLogin ? 'Login' : 'Sign Up'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl leading-none">
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && (
            <p className="text-red-600 text-sm text-center bg-red-100 p-2 rounded-md border border-red-200">
              {error}
            </p>
          )}

          {!isLogin && ( // Show username input only for signup
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                Username
              </label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
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
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
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
            {loading ? (isLogin ? 'Logging In...' : 'Signing Up...') : (isLogin ? 'Login' : 'Sign Up')}
          </button>

          <div className="relative flex items-center justify-center my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-300"></span>
            </div>
            <div className="relative flex justify-center text-sm uppercase">
              <span className="bg-white px-2 text-gray-500">Or</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full py-2 px-4 bg-blue-600 text-white font-semibold rounded-md shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              'Signing in with Google...'
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.0003 4.75C14.0003 4.75 15.6823 5.456 16.9403 6.687L19.2633 4.364C17.4803 2.67 15.0253 1.75 12.0003 1.75C7.30033 1.75 3.22633 4.789 1.63733 9.078L4.54033 11.332C5.23433 9.429 6.86033 7.975 8.87833 7.375L12.0003 4.75Z" fill="#EA4335"/>
                  <path d="M22.2853 10.211H12.0003V14.289H18.5993C18.3583 15.524 17.6973 16.598 16.7023 17.382L19.6643 19.68C21.3283 18.211 22.2853 16.096 22.2853 13.579C22.2853 12.607 22.1273 11.66 21.8493 10.767L22.2853 10.211Z" fill="#4285F4"/>
                  <path d="M8.87833 17.625C6.86033 17.025 5.23433 15.571 4.54033 13.668L1.63733 15.922C3.22633 20.211 7.30033 23.25 12.0003 23.25C15.0253 23.25 17.4803 22.33 19.2633 20.636L16.9403 18.313C15.6823 19.544 14.0003 20.25 12.0003 20.25C9.99933 20.25 8.31733 19.544 7.05933 18.313L8.87833 17.625Z" fill="#FBBC04"/>
                  <path d="M4.54033 11.332L1.63733 9.078C1.40933 8.35 1.28533 7.575 1.28533 6.75C1.28533 6.186 1.34633 5.631 1.46433 5.092L4.54033 7.346C4.54033 7.346 5.23433 9.429 4.54033 11.332Z" fill="#34A853"/>
                </svg>
                Sign in with Google
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
