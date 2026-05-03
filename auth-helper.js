// Authentication Helper Functions
import { auth, db, signOut, onAuthStateChanged, updateProfile, doc, getDoc, setDoc, updateDoc } from './firebase-config.js';

/**
 * Check if user is currently logged in
 * Returns a Promise that resolves to the user object or null
 */
export function getCurrentUser() {
  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user);
    }, (error) => {
      reject(error);
    });
  });
}

/**
 * Logout the current user
 */
export async function logoutUser() {
  try {
    await signOut(auth);
    console.log('User logged out successfully');
    return true;
  } catch (error) {
    console.error('Logout error:', error);
    return false;
  }
}

/**
 * Handle protected route - redirect to login if not authenticated
 */
export async function protectRoute() {
  const user = await getCurrentUser();
  if (!user) {
    window.location.href = 'login.html';
  }
  return user;
}

/**
 * Display user info in UI
 */
export function displayUserInfo(element) {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      const userEmail = user.email.split('@')[0];
      element.textContent = `Welcome, ${userEmail}!`;
      element.style.display = 'block';
    } else {
      element.style.display = 'none';
    }
  });
}

/**
 * Get user's email
 */
export async function getUserEmail() {
  const user = await getCurrentUser();
  return user ? user.email : null;
}

/**
 * Check if email is verified
 */
export async function isEmailVerified() {
  const user = await getCurrentUser();
  return user ? user.emailVerified : false;
}

/**
 * Listen to auth state changes
 */
export function listenToAuthState(callback) {
  return onAuthStateChanged(auth, callback);
}

/**
 * Update user profile information in Firestore
 */
export async function updateUserProfile(userId, profileData) {
  try {
    const userDocRef = doc(db, 'users', userId);
    await updateDoc(userDocRef, {
      ...profileData,
      lastUpdated: new Date()
    });
    return true;
  } catch (error) {
    console.error('Error updating profile:', error);
    return false;
  }
}

/**
 * Get user profile from Firestore
 */
export async function getUserProfile(userId) {
  try {
    const userDocRef = doc(db, 'users', userId);
    const userDocSnap = await getDoc(userDocRef);
    
    if (userDocSnap.exists()) {
      return userDocSnap.data();
    }
    return null;
  } catch (error) {
    console.error('Error fetching profile:', error);
    return null;
  }
}

/**
 * Initialize user profile on signup
 */
export async function initializeUserProfile(userId, email, displayName) {
  try {
    const userDocRef = doc(db, 'users', userId);
    await setDoc(userDocRef, {
      email: email,
      displayName: displayName,
      bio: '',
      favoriteGenre: '',
      watchlistCount: 0,
      hoursWatched: 0,
      createdAt: new Date(),
      lastUpdated: new Date()
    });
    return true;
  } catch (error) {
    console.error('Error initializing profile:', error);
    return false;
  }
}

