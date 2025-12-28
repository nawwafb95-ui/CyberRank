// public/js/firebaseInit.js
// Unified Firebase initialization module - single source of truth
// All files should import auth and db from this module

import {
  initializeApp,
  getApps,
  getApp
} from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js';

import {
  getAuth,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence
} from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js';

// Optional: import connectAuthEmulator if you want to enable Auth emulator
// import { connectAuthEmulator } from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js';

import {
  getFirestore,
  connectFirestoreEmulator
} from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js';

import {
  getFunctions,
  connectFunctionsEmulator
} from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-functions.js';

import { firebaseConfig } from './firebaseConfig.js';

// Initialize Firebase app (singleton pattern)
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const functions = getFunctions(app);

// Connect to Firebase emulators if running locally
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
  try {
    // Firestore emulator
    connectFirestoreEmulator(db, "127.0.0.1", 8082);
    
    // Functions emulator
    connectFunctionsEmulator(functions, "127.0.0.1", 5002);
    
    // Auth emulator (optional - uncomment to enable)
    // connectAuthEmulator(auth, "http://127.0.0.1:9099");
    
    console.log('[firebaseInit] Connected to Firebase emulators');
  } catch (error) {
    console.warn('[firebaseInit] Emulator connection skipped:', error?.message || error);
  }
}

// Set persistence
setPersistence(auth, browserLocalPersistence).catch(console.warn);

// ===== Auth Readiness Mechanism =====
// This ensures guards and other code wait for Firebase auth state to resolve
// before making authentication decisions

let authReady = false;
let authUser = null;
let authReadyPromise = null;
let authReadyResolve = null;

// Create promise that resolves when auth is ready
function createAuthReadyPromise() {
  if (authReadyPromise) return authReadyPromise;
  
  authReadyPromise = new Promise((resolve) => {
    authReadyResolve = resolve;
  });
  
  return authReadyPromise;
}

// Initialize auth readiness tracking
createAuthReadyPromise();

// Set up auth state listener - fires on initial load and on state changes
onAuthStateChanged(auth, (user) => {
  // Update global state
  authUser = user;
  
  // Mark as ready after first callback fires
  if (!authReady) {
    authReady = true;
    window.__authReady = true;
    window.__authUser = user;
    
    // Dispatch custom event
    const event = new CustomEvent('auth:ready', { detail: { user } });
    window.dispatchEvent(event);
    
    // Resolve the promise
    if (authReadyResolve) {
      authReadyResolve();
      authReadyResolve = null;
    }
  } else {
    // Update global state on subsequent changes
    window.__authUser = user;
    
    // Dispatch update event
    const event = new CustomEvent('auth:state-changed', { detail: { user } });
    window.dispatchEvent(event);
  }
});

/**
 * Wait for Firebase auth state to be ready
 * This should be used by guards and other code that needs to check auth state
 * @returns {Promise<boolean>} Resolves to true if user is authenticated, false otherwise
 */
async function waitForAuthReady() {
  if (authReady) {
    return !!authUser;
  }
  
  await authReadyPromise;
  return !!authUser;
}

/**
 * Get current auth user (synchronous, but may be null if not ready)
 * Use waitForAuthReady() first if you need to ensure auth is ready
 * @returns {User|null} Firebase auth user or null
 */
function getCurrentAuthUser() {
  return authUser || window.__authUser || null;
}

/**
 * Check if auth is ready
 * @returns {boolean} True if auth state has been resolved
 */
function isAuthReady() {
  return authReady;
}

// Export auth, db, functions, and app instances
window.auth = auth;
window.db = db;
window.functions = functions;
window.firebaseApp = app;

// Export helpers
window.waitForAuthReady = waitForAuthReady;
window.getCurrentAuthUser = getCurrentAuthUser;
window.isAuthReady = isAuthReady;

// Export for ES modules
export { app, auth, db, functions, waitForAuthReady, getCurrentAuthUser, isAuthReady };

