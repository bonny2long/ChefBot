/* eslint-disable no-undef */
// src/supabase.js
import { createClient } from '@supabase/supabase-js';

// Get Supabase configuration from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const PROFILE_TIMEOUT_MS = 2000;
const DEBUG_AUTH = false;

const debugLog = (...args) => {
  if (DEBUG_AUTH) console.log(...args);
};

const withTimeout = async (promise, ms, label = 'operation') => {
  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timeoutId);
  }
};

// Initialize Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// App ID for multi-tenancy (if needed)
export const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-chefbonbon-app';

// Auth listener setup
export function setupAuthListener(onUserChange, setIsAuthReady) {
  let isCancelled = false;
  let isReady = false;

  const markReady = () => {
    if (isReady) return;
    isReady = true;
    clearTimeout(timeout);
  };

  // Set a timeout to prevent infinite loading
  const timeout = setTimeout(() => {
    if (isCancelled) return;
    console.error('Supabase connection timeout - check your credentials in .env');
    setIsAuthReady(true);
    onUserChange(null, null);
  }, 10000); // 10 second timeout

  // Get initial session
  supabase.auth.getSession()
    .then(async ({ data: { session }, error }) => {
      if (isCancelled) return;
      markReady();
      setIsAuthReady(true); // unblock UI as soon as we have a session result
      
      if (error) {
        console.error('Supabase auth error:', error);
        onUserChange(null, null);
        return;
      }

      if (session?.user) {
        const user = session.user;
        await handleUserProfile(user, onUserChange);
      } else {
        onUserChange(null, null);
      }
    })
    .catch((err) => {
      if (isCancelled) return;
      markReady();
      console.error('Failed to get Supabase session:', err);
      onUserChange(null, null);
    });

  // Listen for auth changes
  const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
    try {
      if (isCancelled) return;
      markReady();
      setIsAuthReady(true); // ensure UI is not blocked on profile fetch
      if (session?.user) {
        const user = session.user;
        await handleUserProfile(user, onUserChange);
      } else {
        onUserChange(null, null);
      }
    } catch (err) {
      console.error('Error in auth state change:', err);
    }
  });

  // Return unsubscribe function
  return () => {
    isCancelled = true;
    clearTimeout(timeout);
    subscription.unsubscribe();
  };
}

// Handle user profile fetching/creation
async function handleUserProfile(user, onUserChange) {
  let usernameFromDb = null;

  try {
    debugLog('Fetching user profile for user ID:', user.id);
    // Immediately surface user metadata while we fetch profile for perceived speed
    onUserChange(createUserObject(user), null);
    
    // Try to fetch user profile with a timeout so we don't hang the UI
    const { data: profile, error } = await withTimeout(
      supabase
        .from('user_profiles')
        .select('username, email')
        .eq('user_id', user.id)
        .single(),
      PROFILE_TIMEOUT_MS,
      'profile fetch'
    );

    debugLog('User profile query result:', { profile, error });

    if (error && error.code !== 'PGRST116') { // PGRST116 = not found
      console.error('Error fetching user profile:', error);
      onUserChange(createUserObject(user), null);
      return;
    }

    if (profile) {
      usernameFromDb = profile.username;
      debugLog('Username from database:', usernameFromDb);
    } else {
      debugLog('No profile found, creating default profile');
      // Create default profile
      const defaultUsername = user.email || user.id;
      const { error: insertError } = await supabase
        .from('user_profiles')
        .insert({
          user_id: user.id,
          username: defaultUsername,
          email: user.email,
          created_at: new Date().toISOString(),
        });

      if (insertError) {
        console.error('Error creating default user profile:', insertError);
      } else {
        usernameFromDb = defaultUsername;
      }
    }

    onUserChange(createUserObject(user), usernameFromDb);
  } catch (error) {
    if (error?.message?.includes('timed out')) {
      console.warn('Profile fetch timed out; proceeding without username');
      onUserChange(createUserObject(user), null);
      return;
    }
    console.error('Error in handleUserProfile:', error);
    onUserChange(createUserObject(user), null);
  }
}

// Create Firebase-compatible user object
function createUserObject(supabaseUser) {
  const userMetadata = supabaseUser.user_metadata || {};
  const displayNameFromMetadata =
    userMetadata.full_name ||
    userMetadata.name ||
    userMetadata.display_name ||
    null;

  return {
    uid: supabaseUser.id,
    email: supabaseUser.email,
    displayName: displayNameFromMetadata,
    isAnonymous: supabaseUser.is_anonymous || false,
    // Add reload method for compatibility
    reload: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    }
  };
}

// Sign in with email and password
export async function signInWithEmailAndPassword(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return { user: createUserObject(data.user) };
}

// Create user with email and password
export async function createUserWithEmailAndPassword(email, password) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) throw error;
  return { user: createUserObject(data.user) };
}

// Sign out
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

// Update profile
export async function updateProfile(user, updates) {
  const { error } = await supabase.auth.updateUser({
    data: updates
  });

  if (error) throw error;
}

// Sign in anonymously
export async function signInAnonymously() {
  const { data, error } = await supabase.auth.signInAnonymously();
  if (error) throw error;
  return { user: createUserObject(data.user) };
}

// Manual anonymous sign-in function
export async function signInAnonymouslyManually() {
  try {
    const result = await signInAnonymously();
    return result.user;
  } catch (error) {
    console.error('Error signing in anonymously:', error);
    throw error;
  }
}

// Get current auth object (for compatibility)
export const auth = {
  currentUser: null,
  // This will be populated by the auth listener
};

// Update auth.currentUser whenever session changes
supabase.auth.onAuthStateChange((event, session) => {
  auth.currentUser = session?.user ? createUserObject(session.user) : null;
});

// Database helper functions

// Add document to collection
export async function addDoc(tableName, data) {
  const { data: result, error } = await supabase
    .from(tableName)
    .insert(data)
    .select()
    .single();

  if (error) throw error;
  return { id: result.id, ...result };
}

// Update document
export async function updateDoc(tableName, id, updates) {
  const { error } = await supabase
    .from(tableName)
    .update(updates)
    .eq('id', id);

  if (error) throw error;
}

// Set document (upsert)
export async function setDoc(tableName, id, data) {
  const { error } = await supabase
    .from(tableName)
    .upsert({ id, ...data });

  if (error) throw error;
}

// Delete document
export async function deleteDoc(tableName, id) {
  const { error } = await supabase
    .from(tableName)
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// Query builder helper
export function query(tableName) {
  return supabase.from(tableName).select();
}

// Get documents with filter
export async function getDocs(tableName, filters = {}) {
  let query = supabase.from(tableName).select();

  // Apply filters
  Object.entries(filters).forEach(([key, value]) => {
    query = query.eq(key, value);
  });

  const { data, error } = await query;
  if (error) throw error;

  return {
    docs: data.map(doc => ({
      id: doc.id,
      data: () => doc,
      exists: () => true,
    })),
    empty: data.length === 0,
  };
}

// Get single document
export async function getDoc(tableName, id) {
  const { data, error } = await supabase
    .from(tableName)
    .select()
    .eq('id', id)
    .single();

  if (error && error.code !== 'PGRST116') throw error;

  return {
    id: data?.id,
    data: () => data,
    exists: () => !!data,
  };
}

// Subscribe to real-time changes (onSnapshot equivalent)
export function onSnapshot(tableName, filters, callback) {
  // Initial fetch
  let query = supabase.from(tableName).select();

  Object.entries(filters).forEach(([key, value]) => {
    query = query.eq(key, value);
  });

  query.then(({ data, error }) => {
    if (error) {
      callback(null, error);
      return;
    }

    callback({
      docs: data.map(doc => ({
        id: doc.id,
        data: () => doc,
      })),
    });
  });

  // Subscribe to changes
  const subscription = supabase
    .channel(`${tableName}_changes`)
    .on('postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: tableName,
        filter: Object.entries(filters).map(([k, v]) => `${k}=eq.${v}`).join(',')
      },
      () => {
        // Re-fetch on change
        query.then(({ data, error }) => {
          if (error) {
            callback(null, error);
            return;
          }

          callback({
            docs: data.map(doc => ({
              id: doc.id,
              data: () => doc,
            })),
          });
        });
      }
    )
    .subscribe();

  // Return unsubscribe function
  return () => {
    subscription.unsubscribe();
  };
}

// Helper functions for recipes (adapted from Firebase structure)
export const getPrivateRecipesCollectionRef = (userId) => {
  if (!userId) {
    console.error('No userId provided for private recipes collection.');
    return null;
  }
  // Return table name - queries will be built per use
  return { tableName: 'private_recipes', userId };
};

export const getPublicRecipesCollectionRef = () => {
  // Return table name - queries will be built per use
  return { tableName: 'public_recipes' };
};

// Re-export for compatibility
export { supabase as db };
