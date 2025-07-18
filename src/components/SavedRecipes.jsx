// src/components/SavedRecipes.jsx
import React, { useState, useEffect } from 'react';
import {
  getPrivateRecipesCollectionRef,
  getPublicRecipesCollectionRef,
  query,
  onSnapshot,
  auth,
  db,
  deleteDoc,
  doc,
  updateDoc,
  addDoc,
  getDocs,
  appId,
  where
} from '../firebase';

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

    const recipesCollectionRef = getPrivateRecipesCollectionRef(userId);
    if (!recipesCollectionRef) {
      setError("Could not retrieve recipe collection. Please try again.");
      setLoading(false);
      return;
    }

    const q = query(recipesCollectionRef);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedRecipes = [];
      snapshot.forEach((doc) => {
        fetchedRecipes.push({ id: doc.id, ...doc.data() });
      });
      fetchedRecipes.sort((a, b) => (b.createdAt?.toDate() || 0) - (a.createdAt?.toDate() || 0));
      setRecipes(fetchedRecipes);
      setLoading(false);
    }, (err) => {
      console.error("Error fetching recipes:", err);
      setError("Failed to load recipes. Please try again.");
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  const handleDeleteRecipe = async (recipeId) => {
    if (!userId) {
   
      return;
    }
    setDeleteStatus(prev => ({ ...prev, [recipeId]: 'Deleting...' }));
    try {
      const recipeDocRef = doc(db, `artifacts/${appId}/users/${userId}/recipes`, recipeId);
      await deleteDoc(recipeDocRef);
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
      const privateRecipeDocRef = doc(db, `artifacts/${appId}/users/${userId}/recipes`, recipeId);
      const publicRecipesCollectionRef = getPublicRecipesCollectionRef();

      if (currentIsPublic) {
        await updateDoc(privateRecipeDocRef, { isPublic: false });

        const publicQuery = query(publicRecipesCollectionRef,
          where('originalRecipeId', '==', recipeId),
          where('sharedBy', '==', userId)
        );
        const publicSnapshot = await getDocs(publicQuery);
        if (!publicSnapshot.empty) {
          publicSnapshot.forEach(async (docToDelete) => {
            await deleteDoc(doc(db, publicRecipesCollectionRef.path, docToDelete.id));
         
          });
        }

        setShareStatus(prev => ({ ...prev, [recipeId]: 'Unshared successfully!' }));
    
      } else {
        await updateDoc(privateRecipeDocRef, { isPublic: true });

        const recipeToShare = recipes.find(r => r.id === recipeId);
        if (recipeToShare) {
          const { id, ...dataToShare } = recipeToShare;

          await addDoc(publicRecipesCollectionRef, {
            ...dataToShare,
            isPublic: true,
            sharedBy: userId,
            sharedByUserName: auth.currentUser?.displayName || 'Anonymous',
            originalRecipeId: recipeId,
            sharedAt: new Date(),
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
      {/* Changed heading color to orange */}
      <h2 className="text-2xl font-bold text-orange-600 mb-6">Your Saved Recipes</h2>
      {recipes.length === 0 ? (
        <div className="flex flex-col items-center justify-center mt-8">
          <p className="text-center text-gray-600 mb-4">You haven't saved any recipes yet.</p>
          {/* Ensure empty state button is orange */}
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
                {recipe.recipeName || 'Untitled Recipe'} {recipe.isPublic && <span className="text-sm font-normal text-green-600">(Public)</span>}
              </h3>
              <p className="text-gray-700 mb-2">
                <span className="font-medium">Ingredients:</span> {recipe.ingredients.join(', ')}
              </p>
              <div className="whitespace-pre-wrap break-words font-sans leading-relaxed text-gray-800 text-base mb-4">
                {recipe.recipeContent}
              </div>
              <p className="text-gray-500 text-xs mb-4">
                Saved on: {recipe.createdAt?.toDate().toLocaleString()}
              </p>
              <div className="flex items-center gap-2">
                {/* Delete button - remains red */}
                <button
                  onClick={() => handleDeleteRecipe(recipe.id)}
                  disabled={deleteStatus[recipe.id] === 'Deleting...'}
                  className="px-4 py-2 bg-red-500 text-white rounded-md text-sm hover:bg-red-600 transition-colors disabled:opacity-50"
                >
                  {deleteStatus[recipe.id] === 'Deleting...' ? 'Deleting...' : 'Delete'}
                </button>
                {/* Share/Unshare button - remains blue/orange */}
                <button
                  onClick={() => handleShareRecipe(recipe.id, recipe.isPublic)}
                  disabled={shareStatus[recipe.id] === 'Sharing...' || shareStatus[recipe.id] === 'Unsharing...'}
                  className={`px-4 py-2 rounded-md text-sm transition-colors ${
                    recipe.isPublic ? 'bg-orange-500 hover:bg-orange-600' : 'bg-blue-500 hover:bg-blue-600'
                  } text-white disabled:opacity-50`}
                >
                  {shareStatus[recipe.id] === 'Sharing...' ? 'Sharing...' :
                   shareStatus[recipe.id] === 'Unsharing...' ? 'Unsharing...' :
                   recipe.isPublic ? 'Unshare' : 'Share'}
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
