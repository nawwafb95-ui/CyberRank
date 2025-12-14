// public/js/dashboard.js

// Firebase CDNs (same version as before)
import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";

// Project files (same names, paths relative from js folder)
import { firebaseConfig } from "./firebaseConfig.js";
import * as DB from "./db.js"; // addScore, listenUserScores

// Initialize Firebase (check for existing app to avoid duplicate initialization)
const app  = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);

// UI elements
const scoresList = document.getElementById("scores");
const scoreInput = document.getElementById("score");
const addBtn     = document.getElementById("btn-add-score");

// Check authentication status
onAuthStateChanged(auth, (user) => {
  if (!user) {
    // If not logged in, redirect to login page in html folder
    location.replace("./login.html");
    return;
  }

  // Load/update scores list for this user
  if (scoresList) {
    DB.listenUserScores(db, user.uid, scoresList);
  }
});

// Add new score
if (addBtn && scoreInput) {
  addBtn.addEventListener("click", async () => {
    const user = auth.currentUser;
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
