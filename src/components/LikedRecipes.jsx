// src/components/LikedRecipes.jsx
import React, { useState, useEffect } from 'react';
import {
  getPublicRecipesCollectionRef,
  query,
  onSnapshot,
  auth,
  db,
  doc,
  collection,
  deleteDoc,
  getDocs,
  where,
  appId
} from '../firebase';

export default function LikedRecipes({ userId, onGoHomeClick }) {
  const [likedRecipes, setLikedRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [unlikeStatus, setUnlikeStatus] = useState({});

  useEffect(() => {
    if (!userId) {
      setLikedRecipes([]);
      setLoading(false);
      setError("Please log in to view your liked recipes.");
      return;
    }

    setLoading(true);
    setError('');

    const publicRecipesCollectionRef = getPublicRecipesCollectionRef();
    if (!publicRecipesCollectionRef) {
      setError("Could not retrieve public recipe feed. Please try again.");
      setLoading(false);
      return;
    }

    const q = query(publicRecipesCollectionRef);

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const fetchedLikedRecipes = [];
      for (const recipeDoc of snapshot.docs) {
        const recipeData = { id: recipeDoc.id, ...recipeDoc.data() };

        const likesQuery = query(collection(db, `artifacts/${appId}/public/data/recipes/${recipeData.id}/likes`), where('userId', '==', userId));
        const likesSnapshot = await getDocs(likesQuery);

        if (!likesSnapshot.empty) {
          recipeData.userLikeDocId = likesSnapshot.docs[0].id;
          fetchedLikedRecipes.push(recipeData);
        }
      }
      fetchedLikedRecipes.sort((a, b) => (b.sharedAt?.toDate() || 0) - (a.sharedAt?.toDate() || 0));
      setLikedRecipes(fetchedLikedRecipes);
      setLoading(false);
    }, (err) => {
      console.error("Error fetching liked recipes:", err);
      setError("Failed to load liked recipes. Please try again.");
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  const handleUnlike = async (recipeId, userLikeDocId) => {
    if (!userId) {
      console.log("You must be logged in to unlike recipes.");
      return;
    }
    setUnlikeStatus(prev => ({ ...prev, [recipeId]: 'Unliking...' }));
    try {
      const likeDocRef = doc(db, `artifacts/${appId}/public/data/recipes/${recipeId}/likes`, userLikeDocId);
      await deleteDoc(likeDocRef);
      setUnlikeStatus(prev => ({ ...prev, [recipeId]: 'Unliked!' }));
      console.log("Recipe unliked:", recipeId);
      setTimeout(() => setUnlikeStatus(prev => ({ ...prev, [recipeId]: '' })), 3000);
    } catch (err) {
      console.error("Error unliking recipe:", err);
      setUnlikeStatus(prev => ({ ...prev, [recipeId]: 'Failed to unlike.' }));
      setTimeout(() => setUnlikeStatus(prev => ({ ...prev, [recipeId]: '' })), 3000);
    }
  };

  if (loading) {
    return <p className="text-center text-gray-600 mt-8">Loading your liked recipes...</p>;
  }

  if (error) {
    return <p className="text-center text-red-600 mt-8">{error}</p>;
  }

  return (
    <section className="p-8 md:p-16 w-full max-w-3xl mx-auto">
      {/* Changed heading color to orange */}
      <h2 className="text-2xl font-bold text-orange-600 mb-6">Your Liked Recipes</h2>
      {likedRecipes.length === 0 ? (
        <div className="flex flex-col items-center justify-center mt-8">
          <p className="text-center text-gray-600 mb-4">You haven't liked any recipes yet.</p>
          {/* Ensure empty state button is orange */}
          <button
            onClick={() => onGoHomeClick()}
            className="px-6 py-3 bg-orange-600 text-white rounded-md text-lg font-semibold hover:bg-orange-700 transition-colors shadow-md"
          >
            Explore Public Feed
          </button>
        </div>
      ) : (
        <div className="grid gap-6">
          {likedRecipes.map((recipe) => (
            <div key={recipe.id} className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{recipe.recipeName || 'Untitled Recipe'}</h3>
              <p className="text-gray-600 text-sm mb-3">
                Shared by: <span className="font-medium">{recipe.sharedByUserName}</span> on {recipe.sharedAt?.toDate().toLocaleString()}
              </p>
              <p className="text-gray-700 mb-2">
                <span className="font-medium">Ingredients:</span> {recipe.ingredients?.join(', ') || 'N/A'}
              </p>
              <div className="whitespace-pre-wrap break-words font-sans leading-relaxed text-gray-800 text-base mb-4">
                {recipe.recipeContent}
              </div>

              {/* Unlike Button - remains red */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleUnlike(recipe.id, recipe.userLikeDocId)}
                  disabled={unlikeStatus[recipe.id] === 'Unliking...'}
                  className="flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd"></path>
                  </svg>
                  Unlike
                </button>
                {unlikeStatus[recipe.id] && unlikeStatus[recipe.id] !== 'Unliking...' && (
                  <p className={`text-sm ${unlikeStatus[recipe.id].includes("Failed") ? 'text-red-600' : 'text-gray-700'}`}>
                    {unlikeStatus[recipe.id]}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
