// src/components/PublicFeed.jsx
import React, { useState, useEffect } from 'react';
import {
  getPublicRecipesCollectionRef,
  query,
  onSnapshot,
  auth,
  db,
  doc,
  collection,
  addDoc,
  deleteDoc,
  getDocs,
  where,
  appId
} from '../firebase';

export default function PublicFeed({ userId, showMessageModal }) {
  const [publicRecipes, setPublicRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [commentInput, setCommentInput] = useState({});
  const [commentStatus, setCommentStatus] = useState({});
  const [expandedRecipes, setExpandedRecipes] = useState({});

  useEffect(() => {
    setLoading(true);
    setError('');

    const publicRecipesCollectionRef = getPublicRecipesCollectionRef();
    if (!publicRecipesCollectionRef) {
      setError("Could not retrieve public recipe feed. Please try again.");
      setLoading(false);
      return;
    }

    const q = query(publicRecipesCollectionRef);

    const unsubscribeRecipes = onSnapshot(q, async (snapshot) => {
      const fetchedPublicRecipes = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        likes: [], // Initialize empty, populated by onSnapshot
        comments: [], // Initialize empty
        likeCount: 0,
        commentCount: 0,
        hasLiked: false,
      }));
      fetchedPublicRecipes.sort((a, b) => (b.sharedAt?.toDate() || 0) - (a.sharedAt?.toDate() || 0));
      setPublicRecipes(fetchedPublicRecipes);
      setLoading(false);

      // Set up real-time listeners for likes and comments
      const unsubscribeSubcollections = fetchedPublicRecipes.map((recipe) => {
        const likesRef = collection(db, `artifacts/${appId}/public/data/recipes/${recipe.id}/likes`);
        const commentsRef = collection(db, `artifacts/${appId}/public/data/recipes/${recipe.id}/comments`);

        const unsubscribeLikes = onSnapshot(likesRef, (likesSnapshot) => {
          const likesData = likesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setPublicRecipes((prev) =>
            prev.map((r) =>
              r.id === recipe.id
                ? {
                    ...r,
                    likes: likesData,
                    likeCount: likesData.length,
                    hasLiked: userId ? likesData.some(like => like.userId === userId) : false,
                  }
                : r
            )
          );
        }, (err) => {
          console.error(`Error listening to likes for recipe ${recipe.id}:`, err);
          setError("Failed to load likes for a recipe.");
        });

        const unsubscribeComments = onSnapshot(commentsRef, (commentsSnapshot) => {
          const commentsData = commentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setPublicRecipes((prev) =>
            prev.map((r) =>
              r.id === recipe.id
                ? {
                    ...r,
                    comments: commentsData,
                    commentCount: commentsData.length,
                  }
                : r
            )
          );
        }, (err) => {
          console.error(`Error listening to comments for recipe ${recipe.id}:`, err);
          setError("Failed to load comments for a recipe.");
        });

        return [unsubscribeLikes, unsubscribeComments];
      }).flat();

      return () => {
        unsubscribeRecipes();
        unsubscribeSubcollections.forEach(unsubscribe => unsubscribe());
      };
    }, (err) => {
      console.error("Error fetching public recipes:", err);
      setError("Failed to load public feed. Please try again.");
      setLoading(false);
    });

    return () => unsubscribeRecipes();
  }, [userId]);

  const handleLike = async (recipeId) => {
    if (!userId) {
      showMessageModal("Login Required", "Please log in to like recipes.");
      return;
    }

    // Optimistic update
    const recipe = publicRecipes.find(r => r.id === recipeId);
    const isCurrentlyLiked = recipe.hasLiked;
    setPublicRecipes((prev) =>
      prev.map((r) =>
        r.id === recipeId
          ? {
              ...r,
              hasLiked: !isCurrentlyLiked,
              likeCount: isCurrentlyLiked ? r.likeCount - 1 : r.likeCount + 1,
              likes: isCurrentlyLiked
                ? r.likes.filter(like => like.userId !== userId)
                : [...r.likes, { id: `temp-${Date.now()}`, userId, userName: auth.currentUser?.displayName || 'Anonymous', likedAt: new Date() }],
            }
          : r
      )
    );

    const likesCollectionRef = collection(db, `artifacts/${appId}/public/data/recipes/${recipeId}/likes`);
    const likeQuery = query(likesCollectionRef, where('userId', '==', userId));
    try {
      const existingLikes = await getDocs(likeQuery);
      if (existingLikes.empty) {
        await addDoc(likesCollectionRef, {
          userId: userId,
          userName: auth.currentUser?.displayName || 'Anonymous',
          likedAt: new Date(),
        });
      } else {
        existingLikes.forEach(async (likeDoc) => {
          await deleteDoc(doc(db, likesCollectionRef.path, likeDoc.id));
        });
      }
    } catch (err) {
      console.error("Error liking/unliking recipe:", err);
      // Roll back optimistic update
      setPublicRecipes((prev) =>
        prev.map((r) =>
          r.id === recipeId
            ? {
                ...r,
                hasLiked: isCurrentlyLiked,
                likeCount: isCurrentlyLiked ? r.likeCount + 1 : r.likeCount - 1,
                likes: isCurrentlyLiked
                  ? [...r.likes, { id: `temp-${Date.now()}`, userId, userName: auth.currentUser?.displayName || 'Anonymous', likedAt: new Date() }]
                  : r.likes.filter(like => like.userId !== userId),
              }
            : r
        )
      );
      showMessageModal("Error", "Failed to update like: " + err.message);
    }
  };

  const handleCommentSubmit = async (recipeId) => {
    if (!userId) {
      showMessageModal("Login Required", "Please log in to comment.");
      setCommentStatus(prev => ({ ...prev, [recipeId]: 'Please log in to comment.' }));
      setTimeout(() => setCommentStatus(prev => ({ ...prev, [recipeId]: '' })), 3000);
      return;
    }
    const commentText = commentInput[recipeId]?.trim();
    if (!commentText) {
      setCommentStatus(prev => ({ ...prev, [recipeId]: 'Comment cannot be empty.' }));
      setTimeout(() => setCommentStatus(prev => ({ ...prev, [recipeId]: '' })), 3000);
      return;
    }

    setCommentStatus(prev => ({ ...prev, [recipeId]: 'Posting...' }));

    // Optimistic update
    const tempComment = {
      id: `temp-${Date.now()}`,
      userId,
      userName: auth.currentUser?.displayName || 'Anonymous',
      comment: commentText,
      createdAt: new Date(),
    };
    setPublicRecipes((prev) =>
      prev.map((r) =>
        r.id === recipeId
          ? {
              ...r,
              comments: [...r.comments, tempComment],
              commentCount: r.commentCount + 1,
            }
          : r
      )
    );
    setCommentInput(prev => ({ ...prev, [recipeId]: '' }));

    try {
      const commentsCollectionRef = collection(db, `artifacts/${appId}/public/data/recipes/${recipeId}/comments`);
      await addDoc(commentsCollectionRef, {
        userId,
        userName: auth.currentUser?.displayName || 'Anonymous',
        comment: commentText,
        createdAt: new Date(),
      });
      setCommentStatus(prev => ({ ...prev, [recipeId]: 'Comment posted!' }));
      setTimeout(() => setCommentStatus(prev => ({ ...prev, [recipeId]: '' })), 3000);
    } catch (err) {
      console.error("Error posting comment:", err);
      // Roll back optimistic update
      setPublicRecipes((prev) =>
        prev.map((r) =>
          r.id === recipeId
            ? {
                ...r,
                comments: r.comments.filter(c => c.id !== tempComment.id),
                commentCount: r.commentCount - 1,
              }
            : r
        )
      );
      setCommentStatus(prev => ({ ...prev, [recipeId]: 'Failed to post comment.' }));
      setTimeout(() => setCommentStatus(prev => ({ ...prev, [recipeId]: '' })), 3000);
      showMessageModal("Error", "Failed to post comment: " + err.message);
    }
  };

  const toggleExpandRecipe = (recipeId) => {
    setExpandedRecipes(prev => ({
      ...prev,
      [recipeId]: !prev[recipeId]
    }));
  };

  if (loading) {
    return <p className="text-center text-gray-600 mt-8">Loading public feed...</p>;
  }

  if (error) {
    return <p className="text-center text-red-600 mt-8">{error}</p>;
  }

  return (
    <section className="p-8 md:p-16 w-full max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold text-orange-600 mb-6">Public Recipe Feed</h2>
      {publicRecipes.length === 0 ? (
        <p className="text-center text-gray-600">No public recipes available yet. Share yours!</p>
      ) : (
        <div className="grid gap-6">
          {publicRecipes.map((recipe) => (
            <div key={recipe.id} className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{recipe.recipeName || 'Untitled Recipe'}</h3>
              <p className="text-gray-600 text-sm mb-3">
                Shared by: <span className="font-medium">{recipe.sharedByUserName}</span> on {recipe.sharedAt?.toDate().toLocaleString()}
              </p>

              {/* Collapsible Recipe Content */}
              {expandedRecipes[recipe.id] ? (
                <>
                  <p className="text-gray-700 mb-2">
                    <span className="font-medium">Ingredients:</span> {recipe.ingredients?.join(', ') || 'N/A'}
                  </p>
                  <div className="whitespace-pre-wrap break-words font-sans leading-relaxed text-gray-800 text-base mb-4">
                    {recipe.recipeContent}
                  </div>
                  <button
                    onClick={() => toggleExpandRecipe(recipe.id)}
                    className="text-blue-600 hover:underline text-sm mb-4 block"
                  >
                    Show Less
                  </button>
                </>
              ) : (
                <button
                  onClick={() => toggleExpandRecipe(recipe.id)}
                  className="text-blue-600 hover:underline text-sm mb-4 block"
                >
                  Read Full Recipe...
                </button>
              )}

              {/* Likes Section */}
              <div className="flex items-center gap-4 mb-4">
                <button
                  onClick={() => handleLike(recipe.id)}
                  disabled={!userId}
                  className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm transition-colors ${
                    recipe.hasLiked ? 'bg-orange-600 text-white hover:bg-orange-700' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  } disabled:opacity-50`}
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd"></path>
                  </svg>
                  {recipe.hasLiked ? 'Liked' : 'Like'} ({recipe.likeCount})
                </button>
              </div>

              {/* Comments Section */}
              <div className="mt-4 border-t border-gray-200 pt-4">
                <h4 className="text-lg font-semibold text-gray-800 mb-3">Comments ({recipe.commentCount})</h4>
                {recipe.comments && recipe.comments.length > 0 ? (
                  <div className="space-y-3 mb-4">
                    {recipe.comments.map(comment => (
                      <div key={comment.id} className="bg-gray-50 p-3 rounded-md border border-gray-100">
                        <p className="text-gray-800 text-sm">
                          <span className="font-medium">{comment.userName}:</span> {comment.comment}
                        </p>
                        <p className="text-gray-500 text-xs mt-1">
                          {comment.createdAt instanceof Date
                            ? comment.createdAt.toLocaleString()
                            : comment.createdAt?.toDate?.().toLocaleString() || 'Unknown date'}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600 text-sm mb-4">No comments yet. Be the first!</p>
                )}

                {userId && (
                  <div className="flex flex-col gap-2">
                    <textarea
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      rows="2"
                      placeholder="Add a comment..."
                      value={commentInput[recipe.id] || ''}
                      onChange={(e) => setCommentInput(prev => ({ ...prev, [recipe.id]: e.target.value }))}
                    ></textarea>
                    <button
                      onClick={() => handleCommentSubmit(recipe.id)}
                      disabled={commentStatus[recipe.id] === 'Posting...' || !commentInput[recipe.id]?.trim()}
                      className="px-4 py-2 bg-orange-600 text-white rounded-md text-sm hover:bg-orange-700 transition-colors disabled:opacity-50 self-end"
                    >
                      {commentStatus[recipe.id] === 'Posting...' ? 'Posting...' : 'Post Comment'}
                    </button>
                    {commentStatus[recipe.id] && commentStatus[recipe.id] !== 'Posting...' && (
                      <p className={`text-sm text-right ${commentStatus[recipe.id].includes("Failed") ? 'text-red-600' : 'text-gray-700'}`}>
                        {commentStatus[recipe.id]}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}