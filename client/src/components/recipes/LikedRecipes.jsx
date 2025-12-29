// src/components/LikedRecipes.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export default function LikedRecipes({ userId, onGoHomeClick, onViewPublicFeedClick, showMessageModal }) {
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

    const fetchLikedRecipes = async () => {
      try {
        // Fetch recipes that the user has liked
        const { data, error } = await supabase
          .from('recipe_likes')
          .select(`
            id,
            recipe_id,
            public_recipes (
              id,
              title,
              ingredients,
              instructions,
              username,
              created_at,
              user_id
            )
          `)
          .eq('user_id', userId);

        if (error) throw error;

        // Process the liked recipes
        const processedRecipes = data
          .filter(like => like.public_recipes) // Filter out any null joins
          .map(like => {
            const recipe = like.public_recipes;
            return {
              id: recipe.id,
              recipeName: recipe.title,
              recipeContent: recipe.instructions,
              ingredients: typeof recipe.ingredients === 'string'
                ? JSON.parse(recipe.ingredients)
                : recipe.ingredients,
              sharedByUserName: recipe.username,
              sharedAt: new Date(recipe.created_at),
              userLikeDocId: like.id, // Store the like ID for unlinking
            };
          })
          .sort((a, b) => b.sharedAt - a.sharedAt);

        setLikedRecipes(processedRecipes);
      } catch (err) {
        console.error("Error fetching liked recipes:", err);
        setError("Failed to load liked recipes. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchLikedRecipes();

    // Set up real-time subscription for likes
    const channel = supabase
      .channel('liked_recipes_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'recipe_likes',
          filter: `user_id=eq.${userId}`
        },
        () => {
          fetchLikedRecipes();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const handleUnlike = async (recipeId, userLikeDocId) => {
    if (!userId) {
      showMessageModal("Login Required", "Please log in to unlike recipes.");
      return;
    }
    setUnlikeStatus(prev => ({ ...prev, [recipeId]: 'Unliking...' }));

    // Optimistic update: Remove recipe from UI
    const recipeToRemove = likedRecipes.find(r => r.id === recipeId);
    setLikedRecipes((prev) => prev.filter(r => r.id !== recipeId));

    try {
      const { error } = await supabase
        .from('recipe_likes')
        .delete()
        .eq('id', userLikeDocId)
        .eq('user_id', userId);

      if (error) throw error;

      setUnlikeStatus(prev => ({ ...prev, [recipeId]: 'Unliked!' }));
      setTimeout(() => setUnlikeStatus(prev => ({ ...prev, [recipeId]: '' })), 3000);
    } catch (err) {
      console.error("Error unliking recipe:", err);

      // Roll back optimistic update
      setLikedRecipes((prev) => [
        ...prev,
        { ...recipeToRemove, userLikeDocId },
      ].sort((a, b) => b.sharedAt - a.sharedAt));

      setUnlikeStatus(prev => ({ ...prev, [recipeId]: 'Failed to unlike.' }));
      setTimeout(() => setUnlikeStatus(prev => ({ ...prev, [recipeId]: '' })), 3000);
      showMessageModal("Error", "Failed to unlike recipe: " + err.message);
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
      <h2 className="text-2xl font-bold text-orange-600 mb-6">Your Liked Recipes</h2>
      {likedRecipes.length === 0 ? (
        <div className="flex flex-col items-center justify-center mt-8 gap-3">
          <p className="text-center text-gray-600">You haven't liked any recipes yet.</p>
          <button
            onClick={() => onViewPublicFeedClick()}
            className="px-6 py-3 bg-orange-600 text-white rounded-md text-lg font-semibold hover:bg-orange-700 transition-colors shadow-md w-full sm:w-auto"
          >
            Explore Public Feed
          </button>
          {onGoHomeClick && (
            <button
              onClick={onGoHomeClick}
              className="px-6 py-2 bg-gray-100 text-gray-800 rounded-md text-sm font-semibold hover:bg-gray-200 transition-colors w-full sm:w-auto"
            >
              Return Home
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-6">
          {likedRecipes.map((recipe) => (
            <div key={recipe.id} className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{recipe.recipeName || 'Untitled Recipe'}</h3>
              <p className="text-gray-600 text-sm mb-3">
                Shared by: <span className="font-medium">{recipe.sharedByUserName}</span> on {recipe.sharedAt?.toLocaleString()}
              </p>
              <p className="text-gray-700 mb-2">
                <span className="font-medium">Ingredients:</span> {Array.isArray(recipe.ingredients) ? recipe.ingredients.join(', ') : recipe.ingredients || 'N/A'}
              </p>
              <div className="whitespace-pre-wrap break-words font-sans leading-relaxed text-gray-800 text-base mb-4">
                {recipe.recipeContent}
              </div>

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
