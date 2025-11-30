// public/js/dashboard.js

// Firebase CDNs (نفس الإصدار اللي كنت تستخدمه)
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";

// ملفات المشروع (نفس الأسماء لكن المسار يصبح نسبي من داخل مجلد js)
import { firebaseConfig } from "./firebaseConfig.js";
import * as DB from "./db.js"; // addScore, listenUserScores

// تهيئة Firebase
const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);

// عناصر الواجهة
const scoresList = document.getElementById("scores");
const scoreInput = document.getElementById("score");
const addBtn     = document.getElementById("btn-add-score");

// التأكد من تسجيل الدخول
onAuthStateChanged(auth, (user) => {
  if (!user) {
    // لو مش مسجّل دخول → رجّعه لصفحة login داخل فولدر html
    location.replace("./login.html");
    return;
  }

  // تحميل / تحديث قائمة السكورات لهذا المستخدم
  if (scoresList) {
    DB.listenUserScores(db, user.uid, scoresList);
  }
});

// إضافة Score جديد
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
