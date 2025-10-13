/* eslint-disable no-undef */
// src/firebase.js
import { initializeApp } from "firebase/app";

// Auth imports
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  signInAnonymously,
  signInWithCustomToken,
} from "firebase/auth";

// Firestore imports
import {
  getFirestore,
  doc,
  getDoc,
  collection,
  addDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  getDocs,
  updateDoc,
  setDoc,
} from "firebase/firestore";

const firebaseConfig = typeof __firebase_c;
onfig !== "undefined"
  ? JSON.parse(__firebase_config)
  : {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID,
      measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
    };

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export const appId =
  typeof __app_id !== "undefined" ? __app_id : "default-chefbonbon-app";

export const getPrivateRecipesCollectionRef = (userId) => {
  if (!userId) {
    console.error("No userId provided for private recipes collection.");
    return null;
  }
  return collection(db, `artifacts/${appId}/users/${userId}/recipes`);
};

export const getPublicRecipesCollectionRef = () => {
  return collection(db, `artifacts/${appId}/public/data/recipes`);
};

export function setupAuthListener(onUserChange, setIsAuthReady) {
  const unsubscribe = onAuthStateChanged(auth, async (user) => {
    if (user) {
      await user.reload(); // Ensure latest user data
      let usernameFromDb = null;
      try {
        const userProfileDocRef = doc(
          db,
          `artifacts/${appId}/users/${user.uid}/profile/data`
        );
        const userProfileDoc = await getDoc(userProfileDocRef);

        if (userProfileDoc.exists()) {
          usernameFromDb = userProfileDoc.data().username;
        } else {
          try {
            const defaultUsername = user.email || user.uid;
            await setDoc(userProfileDocRef, {
              username: defaultUsername,
              email: user.email,
              createdAt: new Date(),
            });
            usernameFromDb = defaultUsername;
          } catch (error) {
            console.error("Error creating default user profile:", error);
          }
        }
        onUserChange(user, usernameFromDb);
      } catch (error) {
        console.error("Error fetching user profile from Firestore:", error);
        onUserChange(user, null);
      }
    } else {
      onUserChange(null, null);
    }
    setIsAuthReady(true);
  });

  return unsubscribe;
}

// Manual anonymous sign-in function
export async function signInAnonymouslyManually() {
  try {
    const userCredential = await signInAnonymously(auth);
    return userCredential.user;
  } catch (error) {
    console.error("Error signing in anonymously:", error);
    throw error;
  }
}

// Export everything you might need from Firebase modules
export {
  auth,
  db,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  signInAnonymously,
  signInWithCustomToken,
  addDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  getDocs,
  doc,
  updateDoc,
  collection,
  setDoc,
};
