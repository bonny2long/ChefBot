// src/components/SavedRecipes.jsx
import React, { useState, useEffect } from 'react';
import { supabase, auth } from '../../lib/supabase';

export default function SavedRecipes({ userId, onGoHomeClick }) {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteStatus, setDeleteStatus] = useState({});
  const [shareStatus, setShareStatus] = useState({});

  useEffect(() => {
    if (!userId) {
      setRecipes([]);
      setLoading(false);
      setError("Please log in to view your saved recipes.");
      return;
    }

    setLoading(true);
    setError('');

    // Fetch initial recipes
    const fetchRecipes = async () => {
      try {
        const { data, error } = await supabase
          .from('private_recipes')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Parse ingredients if stored as JSON string
        const parsedRecipes = data.map(recipe => ({
          ...recipe,
          ingredients: typeof recipe.ingredients === 'string'
            ? JSON.parse(recipe.ingredients)
            : recipe.ingredients,
          recipeName: recipe.title,
          recipeContent: recipe.instructions,
          createdAt: new Date(recipe.created_at),
        }));

        setRecipes(parsedRecipes);
      } catch (err) {
        console.error("Error fetching recipes:", err);
        setError("Failed to load recipes. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchRecipes();

    // Set up real-time subscription
    const channel = supabase
      .channel('private_recipes_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'private_recipes',
          filter: `user_id=eq.${userId}`
        },
        () => {
          fetchRecipes();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const handleDeleteRecipe = async (recipeId) => {
    if (!userId) {
      return;
    }
    setDeleteStatus(prev => ({ ...prev, [recipeId]: 'Deleting...' }));
    try {
      const { error } = await supabase
        .from('private_recipes')
        .delete()
        .eq('id', recipeId)
        .eq('user_id', userId);

      if (error) throw error;

      setDeleteStatus(prev => ({ ...prev, [recipeId]: 'Deleted!' }));
      setTimeout(() => setDeleteStatus(prev => ({ ...prev, [recipeId]: '' })), 3000);
    } catch (err) {
      console.error("Error deleting recipe:", err);
      setDeleteStatus(prev => ({ ...prev, [recipeId]: 'Failed to delete.' }));
      setTimeout(() => setDeleteStatus(prev => ({ ...prev, [recipeId]: '' })), 3000);
    }
  };

  const handleShareRecipe = async (recipeId, currentIsPublic) => {
    if (!userId) {
      return;
    }

    setShareStatus(prev => ({ ...prev, [recipeId]: currentIsPublic ? 'Unsharing...' : 'Sharing...' }));

    try {
      const recipeToShare = recipes.find(r => r.id === recipeId);

      if (currentIsPublic) {
        // Update private recipe
        await supabase
          .from('private_recipes')
          .update({ is_public: false })
          .eq('id', recipeId)
          .eq('user_id', userId);

        // Remove from public recipes
        await supabase
          .from('public_recipes')
          .delete()
          .eq('original_recipe_id', recipeId)
          .eq('user_id', userId);

        setShareStatus(prev => ({ ...prev, [recipeId]: 'Unshared successfully!' }));
      } else {
        // Update private recipe
        await supabase
          .from('private_recipes')
          .update({ is_public: true })
          .eq('id', recipeId)
          .eq('user_id', userId);

        // Add to public recipes
        if (recipeToShare) {
          const { data: userData } = await supabase.auth.getUser();
          const username = auth.currentUser?.displayName || userData?.user?.email || 'Anonymous';

          await supabase
            .from('public_recipes')
            .insert({
              user_id: userId,
              username: username,
              title: recipeToShare.title || recipeToShare.recipeName,
              ingredients: typeof recipeToShare.ingredients === 'string'
                ? recipeToShare.ingredients
                : JSON.stringify(recipeToShare.ingredients),
              instructions: recipeToShare.instructions || recipeToShare.recipeContent,
              original_recipe_id: recipeId,
              created_at: new Date().toISOString(),
            });
        }
        setShareStatus(prev => ({ ...prev, [recipeId]: 'Shared successfully!' }));
      }

      setTimeout(() => setShareStatus(prev => ({ ...prev, [recipeId]: '' })), 3000);
    } catch (err) {
      console.error("Error sharing/unsharing recipe:", err);
      setShareStatus(prev => ({ ...prev, [recipeId]: `Failed to ${currentIsPublic ? 'unshare' : 'share'}.` }));
      setTimeout(() => setShareStatus(prev => ({ ...prev, [recipeId]: '' })), 3000);
    }
  };

  if (loading) {
    return <p className="text-center text-gray-600 mt-8">Loading your recipes...</p>;
  }

  if (error) {
    return <p className="text-center text-red-600 mt-8">{error}</p>;
  }

  return (
    <section className="p-8 md:p-16 w-full max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold text-orange-600 mb-6">Your Saved Recipes</h2>
      {recipes.length === 0 ? (
        <div className="flex flex-col items-center justify-center mt-8">
          <p className="text-center text-gray-600 mb-4">You haven't saved any recipes yet.</p>
          <button
            onClick={onGoHomeClick}
            className="px-6 py-3 bg-orange-600 text-white rounded-md text-lg font-semibold hover:bg-orange-700 transition-colors shadow-md"
          >
            Start Adding Recipes!
          </button>
        </div>
      ) : (
        <div className="grid gap-6">
          {recipes.map((recipe) => (
            <div key={recipe.id} className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                {recipe.recipeName || recipe.title || 'Untitled Recipe'} {recipe.is_public && <span className="text-sm font-normal text-green-600">(Public)</span>}
              </h3>
              <p className="text-gray-700 mb-2">
                <span className="font-medium">Ingredients:</span> {Array.isArray(recipe.ingredients) ? recipe.ingredients.join(', ') : recipe.ingredients}
              </p>
              <div className="whitespace-pre-wrap break-words font-sans leading-relaxed text-gray-800 text-base mb-4">
                {recipe.recipeContent || recipe.instructions}
              </div>
              <p className="text-gray-500 text-xs mb-4">
                Saved on: {recipe.createdAt?.toLocaleString()}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDeleteRecipe(recipe.id)}
                  disabled={deleteStatus[recipe.id] === 'Deleting...'}
                  className="px-4 py-2 bg-red-500 text-white rounded-md text-sm hover:bg-red-600 transition-colors disabled:opacity-50"
                >
                  {deleteStatus[recipe.id] === 'Deleting...' ? 'Deleting...' : 'Delete'}
                </button>
                <button
                  onClick={() => handleShareRecipe(recipe.id, recipe.is_public)}
                  disabled={shareStatus[recipe.id] === 'Sharing...' || shareStatus[recipe.id] === 'Unsharing...'}
                  className={`px-4 py-2 rounded-md text-sm transition-colors ${
                    recipe.is_public ? 'bg-orange-500 hover:bg-orange-600' : 'bg-blue-500 hover:bg-blue-600'
                  } text-white disabled:opacity-50`}
                >
                  {shareStatus[recipe.id] === 'Sharing...' ? 'Sharing...' :
                   shareStatus[recipe.id] === 'Unsharing...' ? 'Unsharing...' :
                   recipe.is_public ? 'Unshare' : 'Share'}
                </button>
                {shareStatus[recipe.id] && shareStatus[recipe.id] !== 'Sharing...' && shareStatus[recipe.id] !== 'Unsharing...' && (
                  <p className={`text-sm ${shareStatus[recipe.id].includes("Failed") ? 'text-red-600' : 'text-gray-700'}`}>
                    {shareStatus[recipe.id]}
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
