// public/js/dashboard.js
// Dashboard page - uses Firebase Auth from firebaseInit.js

import { app, auth, waitForAuthReady } from "./firebaseInit.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";
import * as DB from "./db.js"; // addScore, listenUserScores

const db = getFirestore(app);

// UI elements
const scoresList = document.getElementById("scores");
const scoreInput = document.getElementById("score");
const addBtn     = document.getElementById("btn-add-score");

// Check authentication status - wait for auth readiness
(async () => {
  // Wait for auth state to be ready (no timeout - waits for Firebase to resolve)
  const isAuthenticated = await waitForAuthReady();
  
  if (!isAuthenticated) {
    // Not authenticated - redirect to login
    const loginPath = typeof window.getPath === 'function' ? window.getPath('login') : '/html/login.html';
    const currentPath = window.location.pathname + window.location.search;
    
    // Add next parameter for redirect after login
    if (currentPath && currentPath !== loginPath) {
      const params = new URLSearchParams();
      params.set('next', currentPath);
      window.location.replace(`${loginPath}?${params.toString()}`);
    } else {
      window.location.replace(loginPath);
    }
    return;
  }
  
  // User is authenticated - load scores
  const user = window.__authUser;
  if (user && scoresList) {
    DB.listenUserScores(db, user.uid, scoresList);
  }
  
  // Listen for auth state changes (logout, etc.)
  window.addEventListener('auth:state-changed', (e) => {
    if (!e.detail.user) {
      // User logged out - redirect to login
      const loginPath = typeof window.getPath === 'function' ? window.getPath('login') : '/html/login.html';
      window.location.replace(loginPath);
    }
  });
})();

// Add new score
if (addBtn && scoreInput) {
  addBtn.addEventListener("click", async () => {
    const user = window.__authUser;
    const val  = scoreInput.value;

    if (!user) {
      alert("Not signed in");
      return;
    }

    if (!val) {
      alert("Please enter a score.");
      return;
    }

    try {
      await DB.addScore(db, user.uid, val);
      scoreInput.value = "";
    } catch (e) {
      console.error(e);
      alert(e?.message || "Failed to add score");
    }
  });
}
